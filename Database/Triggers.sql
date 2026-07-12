USE assetflow;

DELIMITER $$

CREATE TRIGGER trg_allocations_before_insert
BEFORE INSERT ON allocations
FOR EACH ROW
BEGIN
    DECLARE v_active_count INT;

    IF NEW.status = 'Active' THEN
        SELECT COUNT(*) INTO v_active_count
          FROM allocations
         WHERE asset_id = NEW.asset_id AND status = 'Active';

        IF v_active_count > 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Asset already has an active allocation';
        END IF;
    END IF;
END$$

CREATE TRIGGER trg_bookings_before_insert
BEFORE INSERT ON bookings
FOR EACH ROW
BEGIN
    DECLARE v_conflict_count INT;

    SELECT COUNT(*) INTO v_conflict_count
      FROM bookings
     WHERE asset_id = NEW.asset_id
       AND status IN ('Upcoming','Ongoing')
       AND NEW.start_time < end_time
       AND NEW.end_time > start_time;

    IF v_conflict_count > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Booking overlaps with an existing reservation';
    END IF;
END$$

CREATE TRIGGER trg_bookings_before_update
BEFORE UPDATE ON bookings
FOR EACH ROW
BEGIN
    DECLARE v_conflict_count INT;

    IF NEW.status IN ('Upcoming','Ongoing')
       AND (NEW.start_time <> OLD.start_time OR NEW.end_time <> OLD.end_time OR NEW.status <> OLD.status) THEN

        SELECT COUNT(*) INTO v_conflict_count
          FROM bookings
         WHERE asset_id = NEW.asset_id
           AND booking_id <> NEW.booking_id
           AND status IN ('Upcoming','Ongoing')
           AND NEW.start_time < end_time
           AND NEW.end_time > start_time;

        IF v_conflict_count > 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Rescheduled booking overlaps with an existing reservation';
        END IF;
    END IF;
END$$

CREATE TRIGGER trg_maintenance_after_update
AFTER UPDATE ON maintenance_requests
FOR EACH ROW
BEGIN
    IF NEW.status = 'Approved' AND OLD.status <> 'Approved' THEN
        UPDATE assets SET status = 'Under Maintenance' WHERE asset_id = NEW.asset_id;

        INSERT INTO notifications (employee_id, type, message, related_entity_type, related_entity_id)
        VALUES (NEW.raised_by, 'Maintenance Approved', 'Your maintenance request has been approved.', 'maintenance', NEW.maintenance_id);
    END IF;

    IF NEW.status = 'Rejected' AND OLD.status <> 'Rejected' THEN
        INSERT INTO notifications (employee_id, type, message, related_entity_type, related_entity_id)
        VALUES (NEW.raised_by, 'Maintenance Rejected', 'Your maintenance request was rejected.', 'maintenance', NEW.maintenance_id);
    END IF;

    IF NEW.status = 'Resolved' AND OLD.status <> 'Resolved' THEN
        UPDATE assets SET status = 'Available' WHERE asset_id = NEW.asset_id;
    END IF;
END$$

CREATE TRIGGER trg_audit_items_after_update
AFTER UPDATE ON audit_items
FOR EACH ROW
BEGIN
    IF NEW.result IN ('Missing','Damaged') AND (OLD.result IS NULL OR OLD.result <> NEW.result) THEN
        INSERT INTO discrepancy_reports (audit_item_id, asset_id, discrepancy_type, resolution_status)
        VALUES (NEW.audit_item_id, NEW.asset_id, NEW.result, 'Open');

        INSERT INTO notifications (employee_id, type, message, related_entity_type, related_entity_id)
        SELECT ac.created_by, 'Audit Discrepancy Flagged',
               CONCAT('Asset flagged as ', NEW.result, ' during audit.'), 'audit', NEW.audit_cycle_id
          FROM audit_cycles ac
         WHERE ac.audit_cycle_id = NEW.audit_cycle_id;
    END IF;
END$$

CREATE TRIGGER trg_allocations_after_update
AFTER UPDATE ON allocations
FOR EACH ROW
BEGIN
    IF NEW.status = 'Returned' AND OLD.status <> 'Returned' THEN
        INSERT INTO activity_logs (employee_id, action, entity_type, entity_id)
        VALUES (NEW.returned_approved_by, 'ASSET_RETURNED', 'asset', NEW.asset_id);
    END IF;
END$$

CREATE TRIGGER trg_bookings_after_update_cancel
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
    IF NEW.status = 'Cancelled' AND OLD.status <> 'Cancelled' THEN
        INSERT INTO activity_logs (employee_id, action, entity_type, entity_id)
        VALUES (NEW.booked_by, 'BOOKING_CANCELLED', 'booking', NEW.booking_id);
    END IF;
END$$

CREATE TRIGGER trg_assets_after_insert
AFTER INSERT ON assets
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (action, entity_type, entity_id)
    VALUES ('ASSET_REGISTERED', 'asset', NEW.asset_id);
END$$

CREATE TRIGGER trg_bookings_after_insert
AFTER INSERT ON bookings
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (employee_id, action, entity_type, entity_id)
    VALUES (NEW.booked_by, 'BOOKING_CREATED', 'booking', NEW.booking_id);
END$$

CREATE TRIGGER trg_maintenance_after_insert
AFTER INSERT ON maintenance_requests
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (employee_id, action, entity_type, entity_id)
    VALUES (NEW.raised_by, 'MAINTENANCE_REQUESTED', 'maintenance', NEW.maintenance_id);
END$$

DELIMITER ;