
USE assetflow;

CREATE OR REPLACE VIEW v_overdue_allocations AS
SELECT
    al.allocation_id,
    al.asset_id,
    a.asset_tag,
    a.name AS asset_name,
    al.employee_id,
    e.name AS employee_name,
    al.department_id,
    d.name AS department_name,
    al.expected_return_date,
    DATEDIFF(CURDATE(), al.expected_return_date) AS days_overdue
FROM allocations al
JOIN assets a ON a.asset_id = al.asset_id
LEFT JOIN employees e ON e.employee_id = al.employee_id
LEFT JOIN departments d ON d.department_id = al.department_id
WHERE al.status = 'Active'
  AND al.expected_return_date IS NOT NULL
  AND al.expected_return_date < CURDATE();

CREATE OR REPLACE VIEW v_upcoming_bookings AS
SELECT
    b.booking_id,
    b.asset_id,
    a.name AS asset_name,
    b.booked_by,
    e.name AS booked_by_name,
    b.start_time,
    b.end_time,
    b.status
FROM bookings b
JOIN assets a ON a.asset_id = b.asset_id
JOIN employees e ON e.employee_id = b.booked_by
WHERE b.status = 'Upcoming'
  AND b.start_time > NOW();

CREATE OR REPLACE VIEW v_asset_current_status AS
SELECT
    a.asset_id,
    a.asset_tag,
    a.name,
    ac.name AS category_name,
    a.status,
    a.condition_status,
    a.location,
    a.is_bookable,
    COALESCE(e.name, d.name, 'Unassigned') AS held_by
FROM assets a
JOIN asset_categories ac ON ac.category_id = a.category_id
LEFT JOIN employees e ON e.employee_id = a.current_holder_employee_id
LEFT JOIN departments d ON d.department_id = a.current_holder_department_id;

CREATE OR REPLACE VIEW v_dashboard_kpis AS
SELECT
    (SELECT COUNT(*) FROM assets WHERE status = 'Available')          AS assets_available,
    (SELECT COUNT(*) FROM assets WHERE status = 'Allocated')          AS assets_allocated,
    (SELECT COUNT(*) FROM maintenance_requests
        WHERE status IN ('Approved','Technician Assigned','In Progress')
          AND DATE(requested_at) = CURDATE())                         AS maintenance_today,
    (SELECT COUNT(*) FROM bookings WHERE status IN ('Upcoming','Ongoing')) AS active_bookings,
    (SELECT COUNT(*) FROM transfer_requests WHERE status = 'Requested')    AS pending_transfers,
    (SELECT COUNT(*) FROM allocations
        WHERE status = 'Active'
          AND expected_return_date IS NOT NULL
          AND expected_return_date >= CURDATE()
          AND expected_return_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)) AS upcoming_returns,
    (SELECT COUNT(*) FROM v_overdue_allocations)                      AS overdue_returns;

CREATE OR REPLACE VIEW v_department_allocation_summary AS
SELECT
    d.department_id,
    d.name AS department_name,
    COUNT(al.allocation_id) AS total_allocations,
    SUM(CASE WHEN al.status = 'Active' THEN 1 ELSE 0 END) AS active_allocations
FROM departments d
LEFT JOIN allocations al ON al.department_id = d.department_id
GROUP BY d.department_id, d.name;

CREATE OR REPLACE VIEW v_asset_utilization AS
SELECT
    a.asset_id,
    a.asset_tag,
    a.name,
    COUNT(DISTINCT al.allocation_id) AS times_allocated,
    COUNT(DISTINCT b.booking_id)     AS times_booked,
    (COUNT(DISTINCT al.allocation_id) + COUNT(DISTINCT b.booking_id)) AS utilization_score
FROM assets a
LEFT JOIN allocations al ON al.asset_id = a.asset_id
LEFT JOIN bookings b ON b.asset_id = a.asset_id AND b.status <> 'Cancelled'
GROUP BY a.asset_id, a.asset_tag, a.name
ORDER BY utilization_score DESC;

CREATE OR REPLACE VIEW v_maintenance_frequency AS
SELECT
    a.asset_id,
    a.asset_tag,
    a.name,
    ac.name AS category_name,
    COUNT(mr.maintenance_id) AS maintenance_count
FROM assets a
JOIN asset_categories ac ON ac.category_id = a.category_id
LEFT JOIN maintenance_requests mr ON mr.asset_id = a.asset_id
GROUP BY a.asset_id, a.asset_tag, a.name, ac.name
ORDER BY maintenance_count DESC;


CREATE OR REPLACE VIEW v_assets_due_for_attention AS
SELECT
    a.asset_id,
    a.asset_tag,
    a.name,
    a.acquisition_date,
    MAX(mr.requested_at) AS last_maintenance_date,
    CASE
        WHEN a.acquisition_date IS NOT NULL AND a.acquisition_date <= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)
            THEN 'Nearing Retirement'
        WHEN MAX(mr.requested_at) IS NULL OR MAX(mr.requested_at) <= DATE_SUB(CURDATE(), INTERVAL 180 DAY)
            THEN 'Due for Maintenance Check'
        ELSE 'OK'
    END AS attention_flag
FROM assets a
LEFT JOIN maintenance_requests mr ON mr.asset_id = a.asset_id
WHERE a.status NOT IN ('Retired','Disposed','Lost')
GROUP BY a.asset_id, a.asset_tag, a.name, a.acquisition_date;

CREATE OR REPLACE VIEW v_booking_heatmap AS
SELECT
    DAYNAME(start_time) AS day_of_week,
    HOUR(start_time) AS hour_of_day,
    COUNT(*) AS booking_count
FROM bookings
WHERE status <> 'Cancelled'
GROUP BY DAYNAME(start_time), HOUR(start_time), DAYOFWEEK(start_time)
ORDER BY DAYOFWEEK(start_time), hour_of_day;

CREATE OR REPLACE VIEW v_open_discrepancies AS
SELECT
    dr.discrepancy_id,
    dr.asset_id,
    a.asset_tag,
    a.name AS asset_name,
    dr.discrepancy_type,
    dr.resolution_status,
    ai.audit_cycle_id,
    acyc.name AS audit_cycle_name,
    dr.created_at
FROM discrepancy_reports dr
JOIN assets a ON a.asset_id = dr.asset_id
JOIN audit_items ai ON ai.audit_item_id = dr.audit_item_id
JOIN audit_cycles acyc ON acyc.audit_cycle_id = ai.audit_cycle_id
WHERE dr.resolution_status <> 'Resolved';