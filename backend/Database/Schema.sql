
CREATE DATABASE IF NOT EXISTS assetflow;
USE assetflow;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE departments (
    department_id       INT AUTO_INCREMENT PRIMARY KEY,
    name                 VARCHAR(150) NOT NULL,
    parent_department_id INT NULL,
    department_head_id   INT NULL,               -- FK added later (references employees)
    status               ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_dept_parent
        FOREIGN KEY (parent_department_id) REFERENCES departments(department_id)
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE employees (
    employee_id     INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    department_id   INT NULL,
    role            ENUM('Admin','Asset Manager','Department Head','Employee') NOT NULL DEFAULT 'Employee',
    status          ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_emp_department
        FOREIGN KEY (department_id) REFERENCES departments(department_id)
        ON DELETE SET NULL
) ENGINE=InnoDB;

ALTER TABLE departments
    ADD CONSTRAINT fk_dept_head
    FOREIGN KEY (department_head_id) REFERENCES employees(employee_id)
    ON DELETE SET NULL;

CREATE TABLE password_reset_tokens (
    token_id     INT AUTO_INCREMENT PRIMARY KEY,
    employee_id  INT NOT NULL,
    token        VARCHAR(255) NOT NULL,
    expires_at   DATETIME NOT NULL,
    used         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_prt_employee
        FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE asset_categories (
    category_id     INT AUTO_INCREMENT PRIMARY KEY,
    name             VARCHAR(100) NOT NULL UNIQUE,
    description      VARCHAR(255) NULL,
    custom_fields    JSON NULL,           -- e.g. {"warranty_period_months": 24}
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE assets (
    asset_id                 INT AUTO_INCREMENT PRIMARY KEY,
    asset_tag                VARCHAR(20) NOT NULL UNIQUE,     -- e.g. AF-0001
    name                     VARCHAR(150) NOT NULL,
    category_id              INT NOT NULL,
    serial_number             VARCHAR(100) NULL,
    qr_code                  VARCHAR(150) NULL,
    acquisition_date          DATE NULL,
    acquisition_cost          DECIMAL(12,2) NULL,             -- for ranking/reports only
    condition_status          ENUM('New','Good','Fair','Poor','Damaged') NOT NULL DEFAULT 'New',
    location                 VARCHAR(150) NULL,
    is_bookable               BOOLEAN NOT NULL DEFAULT FALSE, -- shared/bookable flag
    status                   ENUM('Available','Allocated','Reserved','Under Maintenance','Lost','Retired','Disposed')
                              NOT NULL DEFAULT 'Available',
    current_holder_employee_id   INT NULL,
    current_holder_department_id INT NULL,
    photo_url                VARCHAR(255) NULL,
    created_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_asset_category
        FOREIGN KEY (category_id) REFERENCES asset_categories(category_id),
    CONSTRAINT fk_asset_holder_employee
        FOREIGN KEY (current_holder_employee_id) REFERENCES employees(employee_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_asset_holder_department
        FOREIGN KEY (current_holder_department_id) REFERENCES departments(department_id)
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE asset_documents (
    document_id   INT AUTO_INCREMENT PRIMARY KEY,
    asset_id      INT NOT NULL,
    file_url      VARCHAR(255) NOT NULL,
    file_type     ENUM('Photo','Document') NOT NULL DEFAULT 'Document',
    uploaded_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_docs_asset
        FOREIGN KEY (asset_id) REFERENCES assets(asset_id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE allocations (
    allocation_id         INT AUTO_INCREMENT PRIMARY KEY,
    asset_id              INT NOT NULL,
    employee_id           INT NULL,
    department_id         INT NULL,
    allocated_date         DATE NOT NULL,
    expected_return_date   DATE NULL,
    actual_return_date     DATE NULL,
    return_condition_notes VARCHAR(255) NULL,
    status                ENUM('Active','Returned','Overdue') NOT NULL DEFAULT 'Active',
    allocated_by           INT NOT NULL,          -- employee_id of Asset Manager
    returned_approved_by   INT NULL,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_alloc_asset
        FOREIGN KEY (asset_id) REFERENCES assets(asset_id),
    CONSTRAINT fk_alloc_employee
        FOREIGN KEY (employee_id) REFERENCES employees(employee_id),
    CONSTRAINT fk_alloc_department
        FOREIGN KEY (department_id) REFERENCES departments(department_id),
    CONSTRAINT fk_alloc_by
        FOREIGN KEY (allocated_by) REFERENCES employees(employee_id),
    CONSTRAINT fk_alloc_return_by
        FOREIGN KEY (returned_approved_by) REFERENCES employees(employee_id)
) ENGINE=InnoDB;

CREATE TABLE transfer_requests (
    transfer_id      INT AUTO_INCREMENT PRIMARY KEY,
    asset_id         INT NOT NULL,
    allocation_id    INT NOT NULL,          -- the current active allocation being transferred
    from_employee_id INT NULL,
    to_employee_id   INT NOT NULL,
    requested_by     INT NOT NULL,
    status           ENUM('Requested','Approved','Rejected','Re-allocated') NOT NULL DEFAULT 'Requested',
    approved_by      INT NULL,
    requested_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at      TIMESTAMP NULL,
    CONSTRAINT fk_transfer_asset
        FOREIGN KEY (asset_id) REFERENCES assets(asset_id),
    CONSTRAINT fk_transfer_allocation
        FOREIGN KEY (allocation_id) REFERENCES allocations(allocation_id),
    CONSTRAINT fk_transfer_from
        FOREIGN KEY (from_employee_id) REFERENCES employees(employee_id),
    CONSTRAINT fk_transfer_to
        FOREIGN KEY (to_employee_id) REFERENCES employees(employee_id),
    CONSTRAINT fk_transfer_requested_by
        FOREIGN KEY (requested_by) REFERENCES employees(employee_id),
    CONSTRAINT fk_transfer_approved_by
        FOREIGN KEY (approved_by) REFERENCES employees(employee_id)
) ENGINE=InnoDB;

CREATE TABLE bookings (
    booking_id    INT AUTO_INCREMENT PRIMARY KEY,
    asset_id      INT NOT NULL,             -- must have is_bookable = TRUE
    booked_by     INT NOT NULL,
    department_id INT NULL,                 -- booked on behalf of department
    purpose       VARCHAR(255) NULL,
    start_time    DATETIME NOT NULL,
    end_time      DATETIME NOT NULL,
    status        ENUM('Upcoming','Ongoing','Completed','Cancelled') NOT NULL DEFAULT 'Upcoming',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_asset
        FOREIGN KEY (asset_id) REFERENCES assets(asset_id),
    CONSTRAINT fk_booking_employee
        FOREIGN KEY (booked_by) REFERENCES employees(employee_id),
    CONSTRAINT fk_booking_department
        FOREIGN KEY (department_id) REFERENCES departments(department_id),
    CONSTRAINT chk_booking_time CHECK (end_time > start_time)
) ENGINE=InnoDB;


CREATE TABLE maintenance_requests (
    maintenance_id     INT AUTO_INCREMENT PRIMARY KEY,
    asset_id           INT NOT NULL,
    raised_by          INT NOT NULL,
    issue_description  VARCHAR(500) NOT NULL,
    priority           ENUM('Low','Medium','High','Critical') NOT NULL DEFAULT 'Medium',
    photo_url          VARCHAR(255) NULL,
    status             ENUM('Pending','Approved','Rejected','Technician Assigned','In Progress','Resolved')
                        NOT NULL DEFAULT 'Pending',
    approved_by        INT NULL,
    technician_name    VARCHAR(150) NULL,
    resolution_notes   VARCHAR(500) NULL,
    requested_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at        TIMESTAMP NULL,
    resolved_at        TIMESTAMP NULL,
    CONSTRAINT fk_maint_asset
        FOREIGN KEY (asset_id) REFERENCES assets(asset_id),
    CONSTRAINT fk_maint_raised_by
        FOREIGN KEY (raised_by) REFERENCES employees(employee_id),
    CONSTRAINT fk_maint_approved_by
        FOREIGN KEY (approved_by) REFERENCES employees(employee_id)
) ENGINE=InnoDB;

CREATE TABLE audit_cycles (
    audit_cycle_id     INT AUTO_INCREMENT PRIMARY KEY,
    name               VARCHAR(150) NOT NULL,
    scope_department_id INT NULL,
    scope_location      VARCHAR(150) NULL,
    start_date          DATE NOT NULL,
    end_date            DATE NOT NULL,
    status              ENUM('Planned','In Progress','Closed') NOT NULL DEFAULT 'Planned',
    created_by          INT NOT NULL,
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at            TIMESTAMP NULL,
    CONSTRAINT fk_audit_department
        FOREIGN KEY (scope_department_id) REFERENCES departments(department_id),
    CONSTRAINT fk_audit_created_by
        FOREIGN KEY (created_by) REFERENCES employees(employee_id)
) ENGINE=InnoDB;

CREATE TABLE audit_auditors (
    audit_cycle_id INT NOT NULL,
    employee_id    INT NOT NULL,
    assigned_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (audit_cycle_id, employee_id),
    CONSTRAINT fk_aa_cycle
        FOREIGN KEY (audit_cycle_id) REFERENCES audit_cycles(audit_cycle_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_aa_employee
        FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
) ENGINE=InnoDB;

CREATE TABLE audit_items (
    audit_item_id  INT AUTO_INCREMENT PRIMARY KEY,
    audit_cycle_id INT NOT NULL,
    asset_id       INT NOT NULL,
    result         ENUM('Pending','Verified','Missing','Damaged') NOT NULL DEFAULT 'Pending',
    notes          VARCHAR(255) NULL,
    audited_by     INT NULL,
    audited_at     TIMESTAMP NULL,
    CONSTRAINT fk_ai_cycle
        FOREIGN KEY (audit_cycle_id) REFERENCES audit_cycles(audit_cycle_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_ai_asset
        FOREIGN KEY (asset_id) REFERENCES assets(asset_id),
    CONSTRAINT fk_ai_audited_by
        FOREIGN KEY (audited_by) REFERENCES employees(employee_id),
    UNIQUE KEY uq_cycle_asset (audit_cycle_id, asset_id)
) ENGINE=InnoDB;

CREATE TABLE discrepancy_reports (
    discrepancy_id    INT AUTO_INCREMENT PRIMARY KEY,
    audit_item_id     INT NOT NULL,
    asset_id          INT NOT NULL,
    discrepancy_type  ENUM('Missing','Damaged') NOT NULL,
    resolution_status ENUM('Open','Under Review','Resolved') NOT NULL DEFAULT 'Open',
    resolved_by       INT NULL,
    resolved_at       TIMESTAMP NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_disc_audit_item
        FOREIGN KEY (audit_item_id) REFERENCES audit_items(audit_item_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_disc_asset
        FOREIGN KEY (asset_id) REFERENCES assets(asset_id),
    CONSTRAINT fk_disc_resolved_by
        FOREIGN KEY (resolved_by) REFERENCES employees(employee_id)
) ENGINE=InnoDB;

CREATE TABLE notifications (
    notification_id    INT AUTO_INCREMENT PRIMARY KEY,
    employee_id        INT NOT NULL,
    type               ENUM('Asset Assigned','Maintenance Approved','Maintenance Rejected',
                             'Booking Confirmed','Booking Cancelled','Booking Reminder',
                             'Transfer Approved','Overdue Return Alert','Audit Discrepancy Flagged')
                        NOT NULL,
    message            VARCHAR(255) NOT NULL,
    related_entity_type VARCHAR(50) NULL,     -- 'asset','booking','maintenance','transfer','audit'
    related_entity_id   INT NULL,
    is_read             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_employee
        FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE activity_logs (
    log_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_id  INT NULL,
    action       VARCHAR(150) NOT NULL,       -- e.g. 'ASSET_ALLOCATED', 'BOOKING_CANCELLED'
    entity_type  VARCHAR(50) NOT NULL,
    entity_id    INT NULL,
    details      JSON NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_log_employee
        FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_category ON assets(category_id);
CREATE INDEX idx_assets_location ON assets(location);
CREATE INDEX idx_allocations_asset ON allocations(asset_id);
CREATE INDEX idx_allocations_status ON allocations(status);
CREATE INDEX idx_bookings_asset_time ON bookings(asset_id, start_time, end_time);
CREATE INDEX idx_maintenance_status ON maintenance_requests(status);
CREATE INDEX idx_audit_items_result ON audit_items(result);
CREATE INDEX idx_notifications_employee_read ON notifications(employee_id, is_read);

SET FOREIGN_KEY_CHECKS = 1;