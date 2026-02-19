-- =============================================================================
-- SERVISTECH ERP V4.0 - Row Level Security (RLS) Initialization
-- Multi-tenancy with store_id isolation
-- =============================================================================

-- Enable RLS on all tenant tables
ALTER TABLE "Store" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Device" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RepairOrder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InventoryItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Part" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Supplier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WarrantyClaim" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Commission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TechnicianDebit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FixedExpense" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DailyTarget" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DeliveryRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DeliveryTracking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PettyCash" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- Create policy function for store isolation
CREATE OR REPLACE FUNCTION current_store_id()
RETURNS INTEGER AS $$
BEGIN
    -- Get store_id from session variable (set by application)
    RETURN NULLIF(current_setting('app.current_store_id', true), '')::INTEGER;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policy function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(current_setting('app.is_super_admin', true), 'false')::BOOLEAN;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Create RLS Policies for each table
-- =============================================================================

-- Store policies (super admin can see all, users only their store)
CREATE POLICY store_isolation ON "Store"
    USING (id = current_store_id() OR is_super_admin());

-- User policies
CREATE POLICY user_store_isolation ON "User"
    USING ("storeId" = current_store_id() OR is_super_admin());

-- Customer policies
CREATE POLICY customer_store_isolation ON "Customer"
    USING ("storeId" = current_store_id() OR is_super_admin());

-- Device policies
CREATE POLICY device_store_isolation ON "Device"
    USING ("storeId" = current_store_id() OR is_super_admin());

-- RepairOrder policies
CREATE POLICY repair_order_store_isolation ON "RepairOrder"
    USING ("storeId" = current_store_id() OR is_super_admin());

-- Invoice policies
CREATE POLICY invoice_store_isolation ON "Invoice"
    USING ("storeId" = current_store_id() OR is_super_admin());

-- Payment policies
CREATE POLICY payment_store_isolation ON "Payment"
    USING ("storeId" = current_store_id() OR is_super_admin());

-- InventoryItem policies
CREATE POLICY inventory_store_isolation ON "InventoryItem"
    USING ("storeId" = current_store_id() OR is_super_admin());

-- Part policies
CREATE POLICY part_store_isolation ON "Part"
    USING ("storeId" = current_store_id() OR is_super_admin());

-- Supplier policies
CREATE POLICY supplier_store_isolation ON "Supplier"
    USING ("storeId" = current_store_id() OR is_super_admin());

-- WarrantyClaim policies
CREATE POLICY warranty_store_isolation ON "WarrantyClaim"
    USING ("storeId" = current_store_id() OR is_super_admin());

-- Commission policies
CREATE POLICY commission_store_isolation ON "Commission"
    USING ("storeId" = current_store_id() OR is_super_admin());

-- TechnicianDebit policies
CREATE POLICY debit_store_isolation ON "TechnicianDebit"
    USING ("storeId" = current_store_id() OR is_super_admin());

-- FixedExpense policies
CREATE POLICY expense_store_isolation ON "FixedExpense"
    USING ("storeId" = current_store_id() OR is_super_admin());

-- DailyTarget policies
CREATE POLICY target_store_isolation ON "DailyTarget"
    USING ("storeId" = current_store_id() OR is_super_admin());

-- DeliveryRequest policies
CREATE POLICY delivery_store_isolation ON "DeliveryRequest"
    USING ("storeId" = current_store_id() OR is_super_admin());

-- DeliveryTracking policies
CREATE POLICY tracking_store_isolation ON "DeliveryTracking"
    USING ("storeId" = current_store_id() OR is_super_admin());

-- PettyCash policies
CREATE POLICY pettycash_store_isolation ON "PettyCash"
    USING ("storeId" = current_store_id() OR is_super_admin());

-- AuditLog policies (read-only for users, write by system only)
CREATE POLICY auditlog_store_isolation ON "AuditLog"
    USING ("storeId" = current_store_id() OR is_super_admin());

-- =============================================================================
-- Create indexes for performance
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_user_store ON "User"("storeId");
CREATE INDEX IF NOT EXISTS idx_customer_store ON "Customer"("storeId");
CREATE INDEX IF NOT EXISTS idx_device_store ON "Device"("storeId");
CREATE INDEX IF NOT EXISTS idx_repair_store ON "RepairOrder"("storeId");
CREATE INDEX IF NOT EXISTS idx_invoice_store ON "Invoice"("storeId");
CREATE INDEX IF NOT EXISTS idx_payment_store ON "Payment"("storeId");
CREATE INDEX IF NOT EXISTS idx_inventory_store ON "InventoryItem"("storeId");
CREATE INDEX IF NOT EXISTS idx_warranty_store ON "WarrantyClaim"("storeId");
CREATE INDEX IF NOT EXISTS idx_commission_store ON "Commission"("storeId");
CREATE INDEX IF NOT EXISTS idx_delivery_store ON "DeliveryRequest"("storeId");
CREATE INDEX IF NOT EXISTS idx_pettycash_store ON "PettyCash"("storeId");
CREATE INDEX IF NOT EXISTS idx_auditlog_store ON "AuditLog"("storeId");

-- =============================================================================
-- Create audit trigger function
-- =============================================================================

CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    v_store_id INTEGER;
    v_user_id INTEGER;
BEGIN
    -- Get store_id from the record
    IF TG_OP = 'DELETE' THEN
        v_store_id := OLD."storeId";
    ELSE
        v_store_id := NEW."storeId";
    END IF;
    
    -- Get current user from session
    BEGIN
        v_user_id := NULLIF(current_setting('app.current_user_id', true), '')::INTEGER;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    -- Insert audit log
    INSERT INTO "AuditLog" (
        "storeId",
        "userId",
        "tableName",
        "recordId",
        "action",
        "oldValues",
        "newValues",
        "ipAddress",
        "userAgent",
        "createdAt"
    ) VALUES (
        v_store_id,
        v_user_id,
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id::TEXT
            ELSE NEW.id::TEXT
        END,
        TG_OP,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        current_setting('app.client_ip', true),
        current_setting('app.user_agent', true),
        NOW()
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Apply audit triggers to financial tables
-- =============================================================================

DROP TRIGGER IF EXISTS audit_invoice ON "Invoice";
CREATE TRIGGER audit_invoice
    AFTER INSERT OR UPDATE OR DELETE ON "Invoice"
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_payment ON "Payment";
CREATE TRIGGER audit_payment
    AFTER INSERT OR UPDATE OR DELETE ON "Payment"
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_commission ON "Commission";
CREATE TRIGGER audit_commission
    AFTER INSERT OR UPDATE OR DELETE ON "Commission"
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_pettycash ON "PettyCash";
CREATE TRIGGER audit_pettycash
    AFTER INSERT OR UPDATE OR DELETE ON "PettyCash"
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_warranty ON "WarrantyClaim";
CREATE TRIGGER audit_warranty
    AFTER INSERT OR UPDATE OR DELETE ON "WarrantyClaim"
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- =============================================================================
-- Create function to calculate daily target progress
-- =============================================================================

CREATE OR REPLACE FUNCTION calculate_daily_progress(
    p_store_id INTEGER,
    p_date DATE
)
RETURNS TABLE (
    target_amount DECIMAL,
    current_income DECIMAL,
    progress_percentage DECIMAL,
    remaining DECIMAL,
    status TEXT
) AS $$
DECLARE
    v_target DECIMAL;
    v_income DECIMAL;
    v_progress DECIMAL;
    v_remaining DECIMAL;
    v_status TEXT;
BEGIN
    -- Get target for the date
    SELECT dt."targetAmount" INTO v_target
    FROM "DailyTarget" dt
    WHERE dt."storeId" = p_store_id
      AND dt.date = p_date
      AND dt.active = true;
    
    -- Default target if not set
    IF v_target IS NULL THEN
        v_target := 0;
    END IF;
    
    -- Calculate income for the date
    SELECT COALESCE(SUM(i."finalAmount"), 0) INTO v_income
    FROM "Invoice" i
    WHERE i."storeId" = p_store_id
      AND DATE(i."createdAt") = p_date
      AND i.status != 'CANCELLED';
    
    -- Calculate progress
    IF v_target > 0 THEN
        v_progress := (v_income / v_target) * 100;
    ELSE
        v_progress := 0;
    END IF;
    
    v_remaining := v_target - v_income;
    
    -- Determine status
    IF v_progress >= 100 THEN
        v_status := 'COMPLETED';
    ELSIF v_progress >= 75 THEN
        v_status := 'NEAR_TARGET';
    ELSIF v_progress >= 50 THEN
        v_status := 'IN_PROGRESS';
    ELSE
        v_status := 'BELOW_EXPECTED';
    END IF;
    
    RETURN QUERY SELECT v_target, v_income, v_progress, v_remaining, v_status;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Create view for commission summary
-- =============================================================================

CREATE OR REPLACE VIEW commission_summary AS
SELECT 
    c."storeId",
    c."technicianId",
    u.name as technician_name,
    DATE_TRUNC('month', c."createdAt") as month,
    COUNT(*) as total_repairs,
    SUM(c."grossProfit") as total_gross_profit,
    SUM(c."commissionAmount") as total_commission,
    SUM(c."companyPortion") as total_company_portion,
    SUM(COALESCE(d."amount", 0)) as total_debits,
    SUM(c."commissionAmount") - SUM(COALESCE(d."amount", 0)) as net_payable
FROM "Commission" c
JOIN "User" u ON c."technicianId" = u.id
LEFT JOIN "TechnicianDebit" d ON c."technicianId" = d."technicianId" 
    AND DATE_TRUNC('month', d."date") = DATE_TRUNC('month', c."createdAt")
    AND d.paid = false
GROUP BY c."storeId", c."technicianId", u.name, DATE_TRUNC('month', c."createdAt");

-- Grant permissions
GRANT SELECT ON commission_summary TO servistech;

-- =============================================================================
-- Initialization complete
-- =============================================================================

SELECT 'RLS policies and triggers initialized successfully' as status;
