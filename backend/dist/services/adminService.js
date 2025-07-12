"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_1 = require("../database/supabase");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class AdminService {
    constructor() {
        this.supabase = (0, supabase_1.getSupabase)();
    }
    // Create a new admin (supports multiple active admins per college for different batches)
    async createAdmin(adminData) {
        try {
            // Hash password
            const salt = await bcryptjs_1.default.genSalt(12);
            const passwordHash = await bcryptjs_1.default.hash(adminData.password, salt);
            // Set default permissions based on role
            let permissions = adminData.permissions || [];
            if (!permissions.length) {
                if (adminData.role === 'super-admin') {
                    permissions = [
                        'users.read', 'users.write', 'users.delete',
                        'events.read', 'events.write', 'events.delete',
                        'colleges.read', 'colleges.write', 'colleges.delete',
                        'admins.read', 'admins.write', 'admins.delete',
                        'settings.read', 'settings.write',
                        'analytics.read', 'system.admin'
                    ];
                }
                else {
                    permissions = [
                        'users.read', 'users.write',
                        'events.read', 'events.write', 'events.delete',
                        'analytics.read'
                    ];
                }
            }
            const actualRole = adminData.role || 'admin';
            // For regular admins, require college assignment and batch year
            if (actualRole === 'admin') {
                if (!adminData.assignedCollege) {
                    throw new Error('College assignment is required for regular admins');
                }
                if (!adminData.batchYear) {
                    throw new Error('Batch year is required for regular admins');
                }
            }
            // For super-admins, ensure no college assignment or batch year
            if (actualRole === 'super-admin') {
                if (adminData.assignedCollege) {
                    throw new Error('Super admins cannot be assigned to colleges');
                }
                if (adminData.batchYear) {
                    throw new Error('Super admins cannot have batch years');
                }
            }
            // Create admin with college assignment and batch year if provided
            const insertData = {
                username: adminData.username,
                email: adminData.email.toLowerCase(),
                password_hash: passwordHash,
                full_name: adminData.fullName,
                role: actualRole,
                permissions: permissions,
                is_active: true,
                assigned_college_id: adminData.assignedCollege || null,
                batch_year: adminData.batchYear || null,
                tenure_start_date: adminData.assignedCollege ? new Date().toISOString() : null,
                tenure_end_date: null,
                tenure_is_active: adminData.assignedCollege ? true : false
            };
            const { data, error } = await this.supabase
                .from('admins')
                .insert(insertData)
                .select()
                .single();
            if (error) {
                (0, supabase_1.handleSupabaseError)(error, 'createAdmin');
            }
            // If college is assigned, create tenure entry
            if (adminData.assignedCollege) {
                const { error: tenureError } = await this.supabase
                    .from('college_tenure_heads')
                    .insert({
                    admin_id: data.id,
                    college_id: adminData.assignedCollege,
                    batch_year: adminData.batchYear,
                    start_date: new Date().toISOString(),
                    is_active: true
                });
                if (tenureError) {
                    throw new Error('Could not create tenure entry: ' + tenureError.message);
                }
            }
            // Return the admin with college info
            return this.mapDbAdminWithTenure(data);
        }
        catch (error) {
            console.error('Error creating admin:', error);
            throw error;
        }
    }
    // Find admin by email with proper tenure info
    async findByEmail(email) {
        try {
            const { data, error } = await this.supabase
                .from('admins')
                .select(`
          *,
          college_tenure_heads!left(
            college_id,
            start_date,
            end_date,
            is_active,
            colleges(
              id,
              name,
              code,
              location
            )
          )
        `)
                .eq('email', email.toLowerCase())
                .eq('is_active', true)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                (0, supabase_1.handleSupabaseError)(error, 'findByEmail');
            }
            return this.mapDbAdminWithTenure(data);
        }
        catch (error) {
            console.error('Error finding admin by email:', error);
            throw error;
        }
    }
    // Find admin by username with proper tenure info
    async findByUsername(username) {
        try {
            const { data, error } = await this.supabase
                .from('admins')
                .select(`
          *,
          college_tenure_heads!left(
            college_id,
            start_date,
            end_date,
            is_active,
            colleges(
              id,
              name,
              code,
              location
            )
          )
        `)
                .eq('username', username)
                .eq('is_active', true)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                (0, supabase_1.handleSupabaseError)(error, 'findByUsername');
            }
            return this.mapDbAdminWithTenure(data);
        }
        catch (error) {
            console.error('Error finding admin by username:', error);
            throw error;
        }
    }
    // Find admin by ID with proper tenure info
    async findById(id) {
        try {
            const { data, error } = await this.supabase
                .from('admins')
                .select(`
          *,
          college_tenure_heads!left(
            college_id,
            start_date,
            end_date,
            is_active,
            colleges(
              id,
              name,
              code,
              location
            )
          )
        `)
                .eq('id', id)
                .eq('is_active', true)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                (0, supabase_1.handleSupabaseError)(error, 'findById');
            }
            return this.mapDbAdminWithTenure(data);
        }
        catch (error) {
            console.error('Error finding admin by ID:', error);
            throw error;
        }
    }
    // Compare password
    async comparePassword(admin, password) {
        try {
            // Get the password hash from database
            const { data, error } = await this.supabase
                .from('admins')
                .select('password_hash')
                .eq('id', admin.id)
                .single();
            if (error) {
                (0, supabase_1.handleSupabaseError)(error, 'comparePassword');
            }
            if (!data) {
                return false;
            }
            return await bcryptjs_1.default.compare(password, data.password_hash);
        }
        catch (error) {
            console.error('Error comparing password:', error);
            return false;
        }
    }
    // Verify password by admin ID
    async verifyPassword(adminId, password) {
        try {
            const { data, error } = await this.supabase
                .from('admins')
                .select('password_hash')
                .eq('id', adminId)
                .single();
            if (error) {
                (0, supabase_1.handleSupabaseError)(error, 'verifyPassword');
                return false;
            }
            return await bcryptjs_1.default.compare(password, data.password_hash);
        }
        catch (error) {
            console.error('Error verifying password:', error);
            return false;
        }
    }
    // Update password
    async updatePassword(adminId, newPassword) {
        try {
            const salt = await bcryptjs_1.default.genSalt(12);
            const passwordHash = await bcryptjs_1.default.hash(newPassword, salt);
            const { error } = await this.supabase
                .from('admins')
                .update({ password_hash: passwordHash })
                .eq('id', adminId);
            if (error) {
                (0, supabase_1.handleSupabaseError)(error, 'updatePassword');
                return false;
            }
            return true;
        }
        catch (error) {
            console.error('Error updating password:', error);
            return false;
        }
    }
    // Update admin
    async updateAdmin(id, updateData) {
        try {
            const updateObj = {};
            if (updateData.username !== undefined)
                updateObj.username = updateData.username;
            if (updateData.email !== undefined)
                updateObj.email = updateData.email.toLowerCase();
            if (updateData.fullName !== undefined)
                updateObj.full_name = updateData.fullName;
            if (updateData.role !== undefined)
                updateObj.role = updateData.role;
            if (updateData.assignedCollege !== undefined)
                updateObj.assigned_college_id = updateData.assignedCollege;
            if (updateData.permissions !== undefined)
                updateObj.permissions = updateData.permissions;
            if (updateData.isActive !== undefined)
                updateObj.is_active = updateData.isActive;
            if (updateData.lastLogin !== undefined)
                updateObj.last_login = updateData.lastLogin;
            // Handle tenure info updates
            if (updateData.tenureInfo) {
                if (updateData.tenureInfo.startDate !== undefined) {
                    updateObj.tenure_start_date = updateData.tenureInfo.startDate;
                }
                if (updateData.tenureInfo.endDate !== undefined) {
                    updateObj.tenure_end_date = updateData.tenureInfo.endDate;
                }
                if (updateData.tenureInfo.isActive !== undefined) {
                    updateObj.tenure_is_active = updateData.tenureInfo.isActive;
                }
            }
            // Handle password update
            if (updateData.password) {
                const salt = await bcryptjs_1.default.genSalt(12);
                updateObj.password_hash = await bcryptjs_1.default.hash(updateData.password, salt);
            }
            const { data, error } = await this.supabase
                .from('admins')
                .update(updateObj)
                .eq('id', id)
                .select()
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                (0, supabase_1.handleSupabaseError)(error, 'updateAdmin');
            }
            return this.mapDbAdminToAdmin(data);
        }
        catch (error) {
            console.error('Error updating admin:', error);
            throw error;
        }
    }
    // Get all admins with proper tenure info
    async getAllAdmins(activeOnly = true) {
        try {
            let query = this.supabase
                .from('admins')
                .select(`
          *,
          college_tenure_heads!left(
            college_id,
            start_date,
            end_date,
            is_active,
            colleges(
              id,
              name,
              code,
              location
            )
          )
        `);
            if (activeOnly) {
                query = query.eq('is_active', true);
            }
            const { data, error } = await query;
            if (error) {
                (0, supabase_1.handleSupabaseError)(error, 'getAllAdmins');
            }
            return data ? await Promise.all(data.map((admin) => this.mapDbAdminWithTenure(admin))) : [];
        }
        catch (error) {
            console.error('Error fetching all admins:', error);
            return [];
        }
    }
    // Get admins by role with proper tenure info
    async getAdminsByRole(role, activeOnly = true) {
        try {
            let query = this.supabase
                .from('admins')
                .select(`
          *,
          college_tenure_heads!left(
            college_id,
            start_date,
            end_date,
            is_active,
            colleges(
              id,
              name,
              code,
              location
            )
          )
        `)
                .eq('role', role);
            if (activeOnly) {
                query = query.eq('is_active', true);
            }
            const { data, error } = await query;
            if (error) {
                (0, supabase_1.handleSupabaseError)(error, 'getAdminsByRole');
            }
            // Await all mapDbAdminWithTenure calls
            return data ? await Promise.all(data.map((admin) => this.mapDbAdminWithTenure(admin))) : [];
        }
        catch (error) {
            console.error('Error fetching admins by role:', error);
            return [];
        }
    }
    // Get admin by college with proper tenure info
    async getAdminByCollege(collegeId) {
        try {
            const { data, error } = await this.supabase
                .from('admins')
                .select(`
          *,
          college_tenure_heads!inner(
            college_id,
            start_date,
            end_date,
            is_active,
            colleges(
              id,
              name,
              code,
              location
            )
          )
        `)
                .eq('college_tenure_heads.college_id', collegeId)
                .eq('college_tenure_heads.is_active', true)
                .eq('is_active', true)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                (0, supabase_1.handleSupabaseError)(error, 'getAdminByCollege');
            }
            return this.mapDbAdminWithTenure(data);
        }
        catch (error) {
            console.error('Error getting admin by college:', error);
            throw error;
        }
    }
    // End admin tenure
    async endTenure(adminId, endDate) {
        try {
            const { error } = await this.supabase
                .from('admins')
                .update({
                tenure_end_date: endDate || new Date().toISOString(),
                tenure_is_active: false,
                assigned_college_id: null
            })
                .eq('id', adminId);
            if (error) {
                (0, supabase_1.handleSupabaseError)(error, 'endTenure');
            }
            return true;
        }
        catch (error) {
            console.error('Error ending tenure:', error);
            throw error;
        }
    }
    // Transfer admin to different college
    async transferAdmin(adminId, newCollegeId) {
        try {
            const { error } = await this.supabase
                .from('admins')
                .update({
                assigned_college_id: newCollegeId,
                tenure_start_date: new Date().toISOString(),
                tenure_is_active: true,
                tenure_end_date: null
            })
                .eq('id', adminId);
            if (error) {
                (0, supabase_1.handleSupabaseError)(error, 'transferAdmin');
            }
            return true;
        }
        catch (error) {
            console.error('Error transferring admin:', error);
            throw error;
        }
    }
    // Soft delete admin
    async deleteAdmin(id) {
        try {
            const { error } = await this.supabase
                .from('admins')
                .update({
                is_active: false,
                tenure_is_active: false,
                tenure_end_date: new Date().toISOString()
            })
                .eq('id', id);
            if (error) {
                (0, supabase_1.handleSupabaseError)(error, 'deleteAdmin');
            }
            return true;
        }
        catch (error) {
            console.error('Error deleting admin:', error);
            throw error;
        }
    }
    // Update last login
    async updateLastLogin(id) {
        try {
            const { error } = await this.supabase
                .from('admins')
                .update({ last_login: new Date().toISOString() })
                .eq('id', id);
            if (error) {
                (0, supabase_1.handleSupabaseError)(error, 'updateLastLogin');
            }
            return true;
        }
        catch (error) {
            console.error('Error updating last login:', error);
            throw error;
        }
    }
    // Assign admin to college with batch year
    async assignAdminToCollege(adminId, collegeId, startDate, batchYear) {
        try {
            // Verify admin exists
            const admin = await this.findById(adminId);
            if (!admin) {
                throw new Error('Admin not found');
            }
            // Verify college exists
            const CollegeService = require('./collegeService').default;
            const college = await CollegeService.findById(collegeId);
            if (!college) {
                throw new Error('College not found');
            }
            // Check if this batch year already has an admin for this college
            if (batchYear) {
                const existingAdmins = await this.getAdminsByCollege(collegeId, true);
                const existingBatchAdmin = existingAdmins.find(a => a.batchYear === batchYear && a.id !== adminId);
                if (existingBatchAdmin) {
                    throw new Error(`Batch year ${batchYear} already has an admin assigned to ${college.name}`);
                }
            }
            // End current tenure if admin is already assigned to another college
            if (admin.assignedCollege && admin.assignedCollege.id !== collegeId) {
                await this.endCurrentTenure(adminId);
            }
            // Update admin record
            const updateData = {
                assigned_college_id: collegeId,
                tenure_start_date: startDate || new Date().toISOString(),
                tenure_end_date: null,
                tenure_is_active: true
            };
            if (batchYear) {
                updateData.batch_year = batchYear;
            }
            const { error: updateError } = await this.supabase
                .from('admins')
                .update(updateData)
                .eq('id', adminId);
            if (updateError) {
                (0, supabase_1.handleSupabaseError)(updateError, 'assignAdminToCollege');
            }
            // Create or update tenure entry
            const tenureData = {
                admin_id: adminId,
                college_id: collegeId,
                start_date: startDate || new Date().toISOString(),
                is_active: true
            };
            if (batchYear) {
                tenureData.batch_year = batchYear;
            }
            // Check if tenure entry already exists
            const { data: existingTenure } = await this.supabase
                .from('college_tenure_heads')
                .select('id')
                .eq('admin_id', adminId)
                .eq('college_id', collegeId)
                .single();
            if (existingTenure) {
                // Update existing tenure
                const { error: tenureUpdateError } = await this.supabase
                    .from('college_tenure_heads')
                    .update(tenureData)
                    .eq('id', existingTenure.id);
                if (tenureUpdateError) {
                    throw new Error('Could not update tenure entry: ' + tenureUpdateError.message);
                }
            }
            else {
                // Create new tenure entry
                const { error: tenureError } = await this.supabase
                    .from('college_tenure_heads')
                    .insert(tenureData);
                if (tenureError) {
                    throw new Error('Could not create tenure entry: ' + tenureError.message);
                }
            }
            return true;
        }
        catch (error) {
            console.error('Error assigning admin to college:', error);
            throw error;
        }
    }
    // End current tenure for admin
    async endCurrentTenure(adminId, endDate) {
        try {
            const endDateStr = endDate || new Date().toISOString();
            // End active tenure in tenure heads table
            const { error: tenureError } = await this.supabase
                .from('college_tenure_heads')
                .update({
                end_date: endDateStr,
                is_active: false
            })
                .eq('admin_id', adminId)
                .eq('is_active', true);
            if (tenureError) {
                (0, supabase_1.handleSupabaseError)(tenureError, 'endCurrentTenure');
            }
            // Update admin record
            const { error: adminError } = await this.supabase
                .from('admins')
                .update({
                tenure_end_date: endDateStr,
                tenure_is_active: false
            })
                .eq('id', adminId);
            if (adminError) {
                (0, supabase_1.handleSupabaseError)(adminError, 'endCurrentTenure');
            }
            return true;
        }
        catch (error) {
            console.error('Error ending tenure:', error);
            return false;
        }
    }
    // Get admins by college (current and historical)
    async getAdminsByCollege(collegeId, activeOnly = true) {
        try {
            let query = this.supabase
                .from('admins')
                .select(`
          *,
          college_tenure_heads!inner(
            start_date,
            end_date,
            is_active,
            colleges(
              id,
              name,
              code,
              location
            )
          )
        `)
                .eq('college_tenure_heads.college_id', collegeId);
            if (activeOnly) {
                query = query.eq('college_tenure_heads.is_active', true);
            }
            const { data, error } = await query;
            if (error) {
                (0, supabase_1.handleSupabaseError)(error, 'getAdminsByCollege');
            }
            return data ? await Promise.all(data.map((admin) => this.mapDbAdminWithTenure(admin))) : [];
        }
        catch (error) {
            console.error('Error fetching admins by college:', error);
            return [];
        }
    }
    // Get all admins not currently assigned to any college
    async getUnassignedAdmins() {
        try {
            const { data, error } = await this.supabase
                .from('admins')
                .select('*')
                .is('assigned_college_id', null)
                .eq('is_active', true)
                .neq('role', 'super-admin');
            if (error) {
                (0, supabase_1.handleSupabaseError)(error, 'getUnassignedAdmins');
            }
            return data ? await Promise.all(data.map((admin) => this.mapDbAdminWithTenure(admin))) : [];
        }
        catch (error) {
            console.error('Error fetching unassigned admins:', error);
            return [];
        }
    }
    // Helper method to map database admin to IAdmin interface with college information
    mapDbAdminToAdminWithCollege(dbAdmin) {
        const baseAdmin = this.mapDbAdminToAdmin(dbAdmin);
        // Add college information if available
        if (dbAdmin.colleges) {
            return {
                ...baseAdmin,
                assignedCollege: {
                    id: dbAdmin.colleges.id,
                    name: dbAdmin.colleges.name,
                    code: dbAdmin.colleges.code,
                    location: dbAdmin.colleges.location
                },
                // Add college name and details for frontend display
                collegeInfo: {
                    id: dbAdmin.colleges.id,
                    name: dbAdmin.colleges.name,
                    code: dbAdmin.colleges.code,
                    location: dbAdmin.colleges.location
                }
            };
        }
        return baseAdmin;
    }
    // Helper method to map database admin to IAdmin interface
    mapDbAdminToAdmin(dbAdmin) {
        return {
            id: dbAdmin.id,
            username: dbAdmin.username,
            email: dbAdmin.email,
            fullName: dbAdmin.full_name,
            role: dbAdmin.role,
            assignedCollege: null, // Will be populated by mapDbAdminWithTenure if needed
            batchYear: dbAdmin.batch_year || undefined,
            permissions: dbAdmin.permissions,
            tenureInfo: {
                startDate: dbAdmin.tenure_start_date || '',
                endDate: dbAdmin.tenure_end_date || undefined,
                isActive: dbAdmin.tenure_is_active
            },
            isActive: dbAdmin.is_active,
            lastLogin: dbAdmin.last_login || undefined,
            createdAt: dbAdmin.created_at,
            updatedAt: dbAdmin.updated_at
        };
    }
    // Helper method to map database admin with tenure info to IAdmin interface
    async mapDbAdminWithTenure(dbAdmin) {
        const baseAdmin = this.mapDbAdminToAdmin(dbAdmin);
        // If college_tenure_heads join exists and has college info
        if (dbAdmin.college_tenure_heads && Array.isArray(dbAdmin.college_tenure_heads)) {
            const activeTenure = dbAdmin.college_tenure_heads.find((tenure) => tenure.is_active === true);
            if (activeTenure && activeTenure.colleges) {
                return {
                    ...baseAdmin,
                    assignedCollege: {
                        id: activeTenure.colleges.id,
                        name: activeTenure.colleges.name,
                        code: activeTenure.colleges.code,
                        location: activeTenure.colleges.location
                    },
                    batchYear: activeTenure.batch_year || baseAdmin.batchYear,
                    collegeInfo: {
                        id: activeTenure.colleges.id,
                        name: activeTenure.colleges.name,
                        code: activeTenure.colleges.code,
                        location: activeTenure.colleges.location
                    },
                    tenureInfo: {
                        startDate: activeTenure.start_date || '',
                        endDate: activeTenure.end_date || undefined,
                        isActive: activeTenure.is_active || false
                    }
                };
            }
        }
        // Fallback: If assignedCollege is just an ID, fetch the college object
        if (baseAdmin.assignedCollege && typeof baseAdmin.assignedCollege === 'string') {
            // Import CollegeService here to avoid circular dependency
            const CollegeService = require('./collegeService').default;
            return CollegeService.findById(baseAdmin.assignedCollege).then((college) => {
                if (college) {
                    return {
                        ...baseAdmin,
                        assignedCollege: {
                            id: college.id,
                            name: college.name,
                            code: college.code,
                            location: college.location
                        },
                        collegeInfo: {
                            id: college.id,
                            name: college.name,
                            code: college.code,
                            location: college.location
                        }
                    };
                }
                else {
                    return baseAdmin;
                }
            });
        }
        return baseAdmin;
    }
}
exports.default = new AdminService();
//# sourceMappingURL=adminService.js.map