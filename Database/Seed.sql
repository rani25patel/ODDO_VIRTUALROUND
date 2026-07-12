
USE assetflow;
INSERT INTO departments (department_id, name, parent_department_id, status) VALUES
(1, 'Administration', NULL, 'Active'),
(2, 'Engineering', NULL, 'Active'),
(3, 'Frontend Team', 2, 'Active'),
(4, 'Backend Team', 2, 'Active'),
(5, 'Facilities', NULL, 'Active'),
(6, 'Human Resources', NULL, 'Active');

INSERT INTO employees (employee_id, name, email, password_hash, department_id, role, status) VALUES
(1, 'Ananya Rao',   'admin@assetflow.io',     '$2b$10$placeholderhash0000000000000000000000000000', 1, 'Admin', 'Active'),
(2, 'Priya Sharma',  'priya@assetflow.io',     '$2b$10$placeholderhash0000000000000000000000000000', 3, 'Employee', 'Active'),
(3, 'Raj Mehta',     'raj@assetflow.io',       '$2b$10$placeholderhash0000000000000000000000000000', 4, 'Employee', 'Active'),
(4, 'Karan Verma',   'karan@assetflow.io',     '$2b$10$placeholderhash0000000000000000000000000000', 2, 'Department Head', 'Active'),
(5, 'Simran Kaur',   'simran@assetflow.io',    '$2b$10$placeholderhash0000000000000000000000000000', 5, 'Asset Manager', 'Active'),
(6, 'Vikram Nair',   'vikram@assetflow.io',    '$2b$10$placeholderhash0000000000000000000000000000', 6, 'Employee', 'Active');

UPDATE departments SET department_head_id = 4 WHERE department_id = 2; -- Karan heads Engineering

INSERT INTO asset_categories (category_id, name, description, custom_fields) VALUES
(1, 'Electronics', 'Laptops, monitors, peripherals', JSON_OBJECT('warranty_period_months', 24)),
(2, 'Furniture',   'Desks, chairs, cabinets',        NULL),
(3, 'Vehicles',    'Company cars, vans',              JSON_OBJECT('insurance_renewal_required', TRUE)),
(4, 'Meeting Rooms','Bookable shared spaces',         NULL);

INSERT INTO assets (asset_id, asset_tag, name, category_id, serial_number, acquisition_date, acquisition_cost, condition_status, location, is_bookable, status) VALUES
(1, 'AF-0001', 'Dell Latitude 5440',   1, 'SN-DL5440-001', '2024-01-15', 85000.00, 'Good', 'HQ - 3rd Floor', FALSE, 'Available'),
(2, 'AF-0002', 'MacBook Pro 14"',       1, 'SN-MBP14-002',  '2024-02-10', 165000.00,'New',  'HQ - 3rd Floor', FALSE, 'Available'),
(3, 'AF-0003', 'Ergonomic Chair',       2, 'SN-CHR-003',    '2023-11-05', 12000.00, 'Good', 'HQ - 2nd Floor', FALSE, 'Available'),
(4, 'AF-0004', 'Toyota Innova',         3, 'SN-VEH-004',    '2022-06-01', 1800000.00,'Fair','HQ - Basement Parking', TRUE, 'Available'),
(5, 'AF-0005', 'Meeting Room B2',       4, NULL,             NULL,        NULL,       'New', 'HQ - 4th Floor', TRUE, 'Available'),
(6, 'AF-0006', 'HP LaserJet Printer',   1, 'SN-PRN-006',    '2023-08-20', 22000.00,  'Fair', 'HQ - 3rd Floor', FALSE, 'Available'),
(7, 'AF-0114', 'Laptop AF-0114',        1, 'SN-DL5440-114', '2024-03-01', 88000.00,  'Good', 'HQ - 3rd Floor', FALSE, 'Allocated');

INSERT INTO allocations (allocation_id, asset_id, employee_id, department_id, allocated_date, expected_return_date, status, allocated_by) VALUES
(1, 7, 2, 3, '2024-03-05', '2026-08-01', 'Active', 5);

UPDATE assets SET current_holder_employee_id = 2, current_holder_department_id = 3 WHERE asset_id = 7;

INSERT INTO bookings (booking_id, asset_id, booked_by, department_id, purpose, start_time, end_time, status) VALUES
(1, 5, 3, 4, 'Sprint Planning', '2026-07-15 09:00:00', '2026-07-15 10:00:00', 'Upcoming');

INSERT INTO maintenance_requests (maintenance_id, asset_id, raised_by, issue_description, priority, status) VALUES
(1, 6, 3, 'Printer jams frequently and produces faded prints', 'Medium', 'Pending');



INSERT INTO audit_cycles (audit_cycle_id, name, scope_department_id, start_date, end_date, status, created_by) VALUES
(1, 'Q3 2026 Engineering Asset Audit', 2, '2026-07-01', '2026-07-31', 'In Progress', 1);

INSERT INTO audit_auditors (audit_cycle_id, employee_id) VALUES
(1, 5);

INSERT INTO audit_items (audit_item_id, audit_cycle_id, asset_id, result) VALUES
(1, 1, 1, 'Pending'),
(2, 1, 2, 'Pending'),
(3, 1, 7, 'Pending');

INSERT INTO notifications (employee_id, type, message, related_entity_type, related_entity_id) VALUES
(2, 'Asset Assigned', 'Laptop AF-0114 has been allocated to you.', 'asset', 7);