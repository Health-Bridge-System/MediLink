-- CreateTable
CREATE TABLE `patient` (
    `patient_id` INTEGER NOT NULL AUTO_INCREMENT,
    `full_name` VARCHAR(120) NOT NULL,
    `national_id` VARCHAR(20) NOT NULL,
    `birth_date` DATE NOT NULL,
    `gender` ENUM('MALE', 'FEMALE') NOT NULL,
    `phone` VARCHAR(20) NULL,
    `email` VARCHAR(120) NULL,
    `address` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `patient_national_id_key`(`national_id`),
    PRIMARY KEY (`patient_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff` (
    `staff_id` INTEGER NOT NULL AUTO_INCREMENT,
    `full_name` VARCHAR(120) NOT NULL,
    `role` ENUM('DOCTOR', 'LAB_TECH', 'RADIOLOGIST', 'RECEPTIONIST', 'ADMIN') NOT NULL,
    `specialty` VARCHAR(80) NULL,
    `phone` VARCHAR(20) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`staff_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_account` (
    `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('ADMIN', 'DOCTOR', 'LAB_TECH', 'RADIOLOGIST', 'RECEPTIONIST', 'PATIENT') NOT NULL,
    `staff_id` INTEGER NULL,
    `patient_id` INTEGER NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `last_login` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_account_username_key`(`username`),
    UNIQUE INDEX `user_account_staff_id_key`(`staff_id`),
    UNIQUE INDEX `user_account_patient_id_key`(`patient_id`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_log` (
    `log_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `action` ENUM('LOGIN', 'VIEW', 'CREATE', 'UPDATE', 'DELETE') NOT NULL,
    `table_name` VARCHAR(50) NOT NULL,
    `record_id` INTEGER NULL,
    `logged_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_log_table_name_record_id_idx`(`table_name`, `record_id`),
    PRIMARY KEY (`log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service` (
    `service_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `type` ENUM('LAB', 'RADIOLOGY') NOT NULL,
    `modality` VARCHAR(10) NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `service_name_key`(`name`),
    PRIMARY KEY (`service_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `appointment` (
    `appointment_id` INTEGER NOT NULL AUTO_INCREMENT,
    `patient_id` INTEGER NOT NULL,
    `staff_id` INTEGER NULL,
    `service_id` INTEGER NULL,
    `date_time` DATETIME(3) NOT NULL,
    `status` ENUM('SCHEDULED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW') NOT NULL DEFAULT 'SCHEDULED',
    `notes` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `appointment_staff_id_date_time_idx`(`staff_id`, `date_time`),
    PRIMARY KEY (`appointment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `order_id` INTEGER NOT NULL AUTO_INCREMENT,
    `patient_id` INTEGER NOT NULL,
    `doctor_id` INTEGER NOT NULL,
    `appointment_id` INTEGER NULL,
    `order_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `priority` ENUM('ROUTINE', 'URGENT', 'STAT') NOT NULL DEFAULT 'ROUTINE',
    `status` ENUM('ORDERED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ORDERED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `orders_appointment_id_key`(`appointment_id`),
    PRIMARY KEY (`order_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_item` (
    `item_id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `service_id` INTEGER NOT NULL,
    `performed_by` INTEGER NULL,
    `status` ENUM('ORDERED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ORDERED',
    `completed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lab_result` (
    `result_id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_id` INTEGER NOT NULL,
    `test_name` VARCHAR(80) NOT NULL,
    `value` VARCHAR(40) NOT NULL,
    `unit` VARCHAR(20) NULL,
    `normal_range` VARCHAR(40) NULL,
    `flag` ENUM('NORMAL', 'HIGH', 'LOW', 'CRITICAL') NOT NULL DEFAULT 'NORMAL',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`result_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `imaging_study` (
    `study_id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_id` INTEGER NOT NULL,
    `dicom_study_uid` VARCHAR(128) NOT NULL,
    `image_path` VARCHAR(255) NULL,
    `performed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `imaging_study_item_id_key`(`item_id`),
    UNIQUE INDEX `imaging_study_dicom_study_uid_key`(`dicom_study_uid`),
    PRIMARY KEY (`study_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `imaging_series` (
    `series_id` INTEGER NOT NULL AUTO_INCREMENT,
    `study_id` INTEGER NOT NULL,
    `series_uid` VARCHAR(128) NOT NULL,
    `modality` VARCHAR(10) NULL,
    `body_part` VARCHAR(50) NULL,
    `description` VARCHAR(255) NULL,
    `num_instances` INTEGER NULL,
    `storage_path` VARCHAR(255) NULL,

    UNIQUE INDEX `imaging_series_series_uid_key`(`series_uid`),
    PRIMARY KEY (`series_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `annotation` (
    `annotation_id` INTEGER NOT NULL AUTO_INCREMENT,
    `series_id` INTEGER NOT NULL,
    `instance_uid` VARCHAR(128) NULL,
    `staff_id` INTEGER NOT NULL,
    `type` ENUM('LENGTH', 'ANGLE', 'ROI', 'ARROW', 'TEXT') NOT NULL,
    `geometry` JSON NOT NULL,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`annotation_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `radiology_report` (
    `report_id` INTEGER NOT NULL AUTO_INCREMENT,
    `study_id` INTEGER NOT NULL,
    `radiologist_id` INTEGER NOT NULL,
    `findings` TEXT NULL,
    `impression` TEXT NULL,
    `status` ENUM('DRAFT', 'FINAL') NOT NULL DEFAULT 'DRAFT',
    `signed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `radiology_report_study_id_key`(`study_id`),
    PRIMARY KEY (`report_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `diagnosis` (
    `diagnosis_id` INTEGER NOT NULL AUTO_INCREMENT,
    `patient_id` INTEGER NOT NULL,
    `doctor_id` INTEGER NOT NULL,
    `order_id` INTEGER NULL,
    `icd10_code` VARCHAR(10) NOT NULL,
    `description` VARCHAR(255) NULL,
    `diagnosed_at` DATE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`diagnosis_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prescription` (
    `prescription_id` INTEGER NOT NULL AUTO_INCREMENT,
    `patient_id` INTEGER NOT NULL,
    `doctor_id` INTEGER NOT NULL,
    `issue_date` DATE NOT NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`prescription_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prescription_item` (
    `prescription_item_id` INTEGER NOT NULL AUTO_INCREMENT,
    `prescription_id` INTEGER NOT NULL,
    `drug_name` VARCHAR(100) NOT NULL,
    `dose` VARCHAR(50) NULL,
    `frequency` VARCHAR(50) NULL,
    `duration_days` INTEGER NULL,

    PRIMARY KEY (`prescription_item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoice` (
    `invoice_id` INTEGER NOT NULL AUTO_INCREMENT,
    `patient_id` INTEGER NOT NULL,
    `order_id` INTEGER NOT NULL,
    `total` DECIMAL(10, 2) NOT NULL,
    `payment_status` ENUM('UNPAID', 'PARTIAL', 'PAID') NOT NULL DEFAULT 'UNPAID',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `invoice_order_id_key`(`order_id`),
    PRIMARY KEY (`invoice_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoice_item` (
    `invoice_item_id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoice_id` INTEGER NOT NULL,
    `order_item_id` INTEGER NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `icd10_code` VARCHAR(10) NULL,

    UNIQUE INDEX `invoice_item_order_item_id_key`(`order_item_id`),
    PRIMARY KEY (`invoice_item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment` (
    `payment_id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoice_id` INTEGER NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `method` ENUM('CASH', 'CARD', 'INSURANCE') NOT NULL,
    `paid_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`payment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cdss_alert` (
    `alert_id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_id` INTEGER NOT NULL,
    `severity` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    `message` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`alert_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cdss_result` (
    `cdss_result_id` INTEGER NOT NULL AUTO_INCREMENT,
    `study_id` INTEGER NOT NULL,
    `model_name` VARCHAR(100) NOT NULL,
    `prediction` VARCHAR(100) NOT NULL,
    `confidence` DECIMAL(5, 4) NULL,
    `heatmap_path` VARCHAR(255) NULL,
    `details` JSON NULL,
    `reviewed_by` INTEGER NULL,
    `review_status` ENUM('PENDING', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`cdss_result_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hl7_message` (
    `message_id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NULL,
    `patient_id` INTEGER NULL,
    `message_type` VARCHAR(20) NOT NULL,
    `direction` ENUM('OUTBOUND', 'INBOUND') NOT NULL,
    `status` ENUM('QUEUED', 'SENT', 'ACKED', 'FAILED') NOT NULL DEFAULT 'QUEUED',
    `control_id` VARCHAR(50) NOT NULL,
    `raw_message` TEXT NOT NULL,
    `ack_code` ENUM('AA', 'AE', 'AR') NULL,
    `error` VARCHAR(255) NULL,
    `sent_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `hl7_message_control_id_key`(`control_id`),
    PRIMARY KEY (`message_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_account` ADD CONSTRAINT `user_account_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`staff_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_account` ADD CONSTRAINT `user_account_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patient`(`patient_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_log` ADD CONSTRAINT `audit_log_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user_account`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment` ADD CONSTRAINT `appointment_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patient`(`patient_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment` ADD CONSTRAINT `appointment_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`staff_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment` ADD CONSTRAINT `appointment_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `service`(`service_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patient`(`patient_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_doctor_id_fkey` FOREIGN KEY (`doctor_id`) REFERENCES `staff`(`staff_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_appointment_id_fkey` FOREIGN KEY (`appointment_id`) REFERENCES `appointment`(`appointment_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_item` ADD CONSTRAINT `order_item_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_item` ADD CONSTRAINT `order_item_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `service`(`service_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_item` ADD CONSTRAINT `order_item_performed_by_fkey` FOREIGN KEY (`performed_by`) REFERENCES `staff`(`staff_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lab_result` ADD CONSTRAINT `lab_result_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `order_item`(`item_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `imaging_study` ADD CONSTRAINT `imaging_study_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `order_item`(`item_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `imaging_series` ADD CONSTRAINT `imaging_series_study_id_fkey` FOREIGN KEY (`study_id`) REFERENCES `imaging_study`(`study_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `annotation` ADD CONSTRAINT `annotation_series_id_fkey` FOREIGN KEY (`series_id`) REFERENCES `imaging_series`(`series_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `annotation` ADD CONSTRAINT `annotation_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`staff_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `radiology_report` ADD CONSTRAINT `radiology_report_study_id_fkey` FOREIGN KEY (`study_id`) REFERENCES `imaging_study`(`study_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `radiology_report` ADD CONSTRAINT `radiology_report_radiologist_id_fkey` FOREIGN KEY (`radiologist_id`) REFERENCES `staff`(`staff_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diagnosis` ADD CONSTRAINT `diagnosis_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patient`(`patient_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diagnosis` ADD CONSTRAINT `diagnosis_doctor_id_fkey` FOREIGN KEY (`doctor_id`) REFERENCES `staff`(`staff_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diagnosis` ADD CONSTRAINT `diagnosis_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescription` ADD CONSTRAINT `prescription_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patient`(`patient_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescription` ADD CONSTRAINT `prescription_doctor_id_fkey` FOREIGN KEY (`doctor_id`) REFERENCES `staff`(`staff_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescription_item` ADD CONSTRAINT `prescription_item_prescription_id_fkey` FOREIGN KEY (`prescription_id`) REFERENCES `prescription`(`prescription_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice` ADD CONSTRAINT `invoice_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patient`(`patient_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice` ADD CONSTRAINT `invoice_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice_item` ADD CONSTRAINT `invoice_item_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoice`(`invoice_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice_item` ADD CONSTRAINT `invoice_item_order_item_id_fkey` FOREIGN KEY (`order_item_id`) REFERENCES `order_item`(`item_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment` ADD CONSTRAINT `payment_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoice`(`invoice_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cdss_alert` ADD CONSTRAINT `cdss_alert_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `order_item`(`item_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cdss_result` ADD CONSTRAINT `cdss_result_study_id_fkey` FOREIGN KEY (`study_id`) REFERENCES `imaging_study`(`study_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cdss_result` ADD CONSTRAINT `cdss_result_reviewed_by_fkey` FOREIGN KEY (`reviewed_by`) REFERENCES `staff`(`staff_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hl7_message` ADD CONSTRAINT `hl7_message_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hl7_message` ADD CONSTRAINT `hl7_message_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patient`(`patient_id`) ON DELETE SET NULL ON UPDATE CASCADE;
