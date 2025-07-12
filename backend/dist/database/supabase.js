"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testConnection = exports.handleSupabaseError = exports.getSupabase = exports.initializeSupabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
let supabase = null;
const initializeSupabase = () => {
    if (!supabase) {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY');
        }
        supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
    }
    return supabase;
};
exports.initializeSupabase = initializeSupabase;
const getSupabase = () => {
    if (!supabase) {
        // Auto-initialize if not already done
        return (0, exports.initializeSupabase)();
    }
    return supabase;
};
exports.getSupabase = getSupabase;
// Helper function for error handling
const handleSupabaseError = (error, operation) => {
    console.error(`Supabase error during ${operation}:`, error);
    throw new Error(`Database operation failed: ${operation}`);
};
exports.handleSupabaseError = handleSupabaseError;
// Connection test function
const testConnection = async () => {
    try {
        const supabase = (0, exports.getSupabase)();
        const { data, error } = await supabase
            .from('colleges')
            .select('count')
            .limit(1);
        if (error) {
            console.error('Supabase connection test failed:', error);
            return false;
        }
        console.log('✅ Supabase connection successful');
        return true;
    }
    catch (error) {
        console.error('Supabase connection test error:', error);
        return false;
    }
};
exports.testConnection = testConnection;
exports.default = exports.getSupabase;
//# sourceMappingURL=supabase.js.map