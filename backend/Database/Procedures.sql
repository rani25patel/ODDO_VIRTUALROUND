
USE assetflow;

DELIMITER $$

CREATE PROCEDURE sp_allocate_asset (
    IN p_asset_id INT,
    IN p_employee_id INT,
    IN p_department_id INT,
    IN p_expected_return_date DATE,
    IN p_allocated_by INT
)
BEGIN
    DECLARE v_status VARCHAR(30);

    SELECT status INTO v_status FROM assets WHERE asset_id = p_asset_id FOR UPDATE;

    IF v_status IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Asset not found';
    ELSEIF v_status <> 'Available' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Asset is currently held - use transfer request instead';
    END IF;

    INSERT INTO allocations (asset_id, employee_id, department_id, allocated_date, expected_return_date, status, allocated_by)
    VALUES (p_asset_id, p_employee_id, p_department_id, CURDATE(), p_expected_return_date, 'Active', p_allocated_by);

    UPDATE assets
       SET status = 'Allocated',
           current_holder_employee_id = p_employee_id,
           current_holder_department_id = p_department_id
     WHERE asset_id = p_asset_id;

    INSERT INTO notifications (employee_id, type, message, related_entity_type, related_entity_id)
    VALUES (p_employee_id, 'Asset Assigned', CONCAT('Asset has been allocated to you.'), 'asset', p_asset_id);

    INSERT INTO activity_logs (employee_id, action, entity_type, entity_id)
    VALUES (p_allocated_by, 'ASSET_ALLOCATED', 'asset', p_asset_id);
END$$

CREATE PROCEDURE sp_request_transfer (
    IN p_asset_id INT,
    IN p_to_employee_id INT,
    IN p_requested_by INT
)
BEGIN
    DECLARE v_allocation_id INT;
    DECLARE v_from_employee_id INT;

    SELECT allocation_id, employee_id INTO v_allocation_id, v_from_employee_id
    FROM allocations
    WHERE asset_id = p_asset_id AND status = 'Active'
    LIMIT 1;

    IF v_allocation_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No active allocation found for this asset';
    END IF;

    INSERT INTO transfer_requests (asset_id, allocation_id, from_employee_id, to_employee_id, requested_by, status)
    VALUES (p_asset_id, v_allocation_id, v_from_employee_id, p_to_employee_id, p_requested_by, 'Requested');
END$$

CREATE PROCEDURE sp_approve_transfer (
    IN p_transfer_id INT,
    IN p_approved_by INT
)
BEGIN
    DECLARE v_asset_id INT;
    DECLARE v_old_allocation_id INT;
    DECLARE v_to_employee_id INT;

    SELECT asset_id, allocation_id, to_employee_id
      INTO v_asset_id, v_old_allocation_id, v_to_employee_id
      FROM transfer_requests
     WHERE transfer_id = p_transfer_id AND status = 'Requested';

    IF v_asset_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Transfer request not found or already processed';
    END IF;

    UPDATE allocations
       SET status = 'Returned', actual_return_date = CURDATE()
     WHERE allocation_id = v_old_allocation_id;

    INSERT INTO allocations (asset_id, employee_id, allocated_date, status, allocated_by)
    VALUES (v_asset_id, v_to_employee_id, CURDATE(), 'Active', p_approved_by);

    UPDATE assets
       SET current_holder_employee_id = v_to_employee_id,
           status = 'Allocated'
     WHERE asset_id = v_asset_id;

    UPDATE transfer_requests
       SET status = 'Re-allocated', approved_by = p_approved_by, approved_at = NOW()
     WHERE transfer_id = p_transfer_id;

    INSERT INTO notifications (employee_id, type, message, related_entity_type, related_entity_id)
    VALUES (v_to_employee_id, 'Transfer Approved', 'Asset transfer has been approved.', 'asset', v_asset_id);
END$$

CREATE PROCEDURE sp_return_asset (
    IN p_allocation_id INT,
    IN p_condition_notes VARCHAR(255),
    IN p_approved_by INT
)
BEGIN
    DECLARE v_asset_id INT;

    SELECT asset_id INTO v_asset_id FROM allocations WHERE allocation_id = p_allocation_id;

    IF v_asset_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Allocation not found';
    END IF;

    UPDATE allocations
       SET status = 'Returned',
           actual_return_date = CURDATE(),
           return_condition_notes = p_condition_notes,
           returned_approved_by = p_approved_by
     WHERE allocation_id = p_allocation_id;

    UPDATE assets
       SET status = 'Available',
           current_holder_employee_id = NULL,
           current_holder_department_id = NULL
     WHERE asset_id = v_asset_id;
END$$

CREATE PROCEDURE sp_book_resource (
    IN p_asset_id INT,
    IN p_booked_by INT,
    IN p_department_id INT,
    IN p_purpose VARCHAR(255),
    IN p_start_time DATETIME,
    IN p_end_time DATETIME
)
BEGIN
    DECLARE v_is_bookable BOOLEAN;
    DECLARE v_conflict_count INT;

    SELECT is_bookable INTO v_is_bookable FROM assets WHERE asset_id = p_asset_id;

    IF v_is_bookable IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Asset not found';
    ELSEIF v_is_bookable = FALSE THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Asset is not marked as bookable';
    END IF;

    SELECT COUNT(*) INTO v_conflict_count
      FROM bookings
     WHERE asset_id = p_asset_id
       AND status IN ('Upcoming','Ongoing')
       AND p_start_time < end_time
       AND p_end_time > start_time;

    IF v_conflict_count > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Booking overlaps with an existing reservation';
    END IF;

    INSERT INTO bookings (asset_id, booked_by, department_id, purpose, start_time, end_time, status)
    VALUES (p_asset_id, p_booked_by, p_department_id, p_purpose, p_start_time, p_end_time, 'Upcoming');

    INSERT INTO notifications (employee_id, type, message, related_entity_type, related_entity_id)
    VALUES (p_booked_by, 'Booking Confirmed', 'Your resource booking has been confirmed.', 'booking', LAST_INSERT_ID());
END$$

CREATE PROCEDURE sp_cancel_booking (
    IN p_booking_id INT
)
BEGIN
    DECLARE v_booked_by INT;

    SELECT booked_by INTO v_booked_by FROM bookings WHERE booking_id = p_booking_id;

    UPDATE bookings SET status = 'Cancelled' WHERE booking_id = p_booking_id;

    INSERT INTO notifications (employee_id, type, message, related_entity_type, related_entity_id)
    VALUES (v_booked_by, 'Booking Cancelled', 'Your resource booking was cancelled.', 'booking', p_booking_id);
END$$

CREATE PROCEDURE sp_raise_maintenance_request (
    IN p_asset_id INT,
    IN p_raised_by INT,
    IN p_issue_description VARCHAR(500),
    IN p_priority VARCHAR(20),
    IN p_photo_url VARCHAR(255)
)
BEGIN
    INSERT INTO maintenance_requests (asset_id, raised_by, issue_description, priority, photo_url, status)
    VALUES (p_asset_id, p_raised_by, p_issue_description, p_priority, p_photo_url, 'Pending');
END$$

CREATE PROCEDURE sp_approve_maintenance (
    IN p_maintenance_id INT,
    IN p_approved_by INT,
    IN p_decision ENUM('Approved','Rejected')
)
BEGIN
    UPDATE maintenance_requests
       SET status = p_decision, approved_by = p_approved_by, approved_at = NOW()
     WHERE maintenance_id = p_maintenance_id AND status = 'Pending';
END$$

CREATE PROCEDURE sp_resolve_maintenance (
    IN p_maintenance_id INT,
    IN p_resolution_notes VARCHAR(500)
)
BEGIN
    UPDATE maintenance_requests
       SET status = 'Resolved', resolution_notes = p_resolution_notes, resolved_at = NOW()
     WHERE maintenance_id = p_maintenance_id;
END$$


CREATE PROCEDURE sp_create_audit_cycle (
    IN p_name VARCHAR(150),
    IN p_scope_department_id INT,
    IN p_scope_location VARCHAR(150),
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_created_by INT
)
BEGIN
    DECLARE v_cycle_id INT;

    INSERT INTO audit_cycles (name, scope_department_id, scope_location, start_date, end_date, status, created_by)
    VALUES (p_name, p_scope_department_id, p_scope_location, p_start_date, p_end_date, 'Planned', p_created_by);

    SET v_cycle_id = LAST_INSERT_ID();

    INSERT INTO audit_items (audit_cycle_id, asset_id, result)
    SELECT v_cycle_id, a.asset_id, 'Pending'
      FROM assets a
     WHERE (p_scope_department_id IS NULL OR a.current_holder_department_id = p_scope_department_id)
       AND (p_scope_location IS NULL OR a.location = p_scope_location);
END$$

CREATE PROCEDURE sp_close_audit_cycle (
    IN p_audit_cycle_id INT
)
BEGIN
    UPDATE assets a
       JOIN audit_items ai ON ai.asset_id = a.asset_id
       SET a.status = 'Lost'
     WHERE ai.audit_cycle_id = p_audit_cycle_id
       AND ai.result = 'Missing';

    UPDATE audit_cycles
       SET status = 'Closed', closed_at = NOW()
     WHERE audit_cycle_id = p_audit_cycle_id;
END$$

DELIMITER ;