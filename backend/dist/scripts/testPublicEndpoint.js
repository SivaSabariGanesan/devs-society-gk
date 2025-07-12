"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const testPublicEndpoint = async () => {
    try {
        console.log('🧪 Testing public colleges endpoint...');
        const response = await (0, node_fetch_1.default)('http://localhost:5050/api/public/colleges');
        const data = await response.json();
        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(data, null, 2));
        if (data.success) {
            console.log('✅ Public endpoint working!');
            console.log(`Found ${data.count} colleges:`);
            data.colleges.forEach((college, index) => {
                console.log(`  ${index + 1}. ${college.name} (${college.code})`);
                if (college.currentTenureHeads && college.currentTenureHeads.length > 0) {
                    console.log(`     Active admins: ${college.currentTenureHeads.length}`);
                    college.currentTenureHeads.forEach((tenure) => {
                        console.log(`       - ${tenure.adminName} (Batch ${tenure.batchYear})`);
                    });
                }
                else {
                    console.log(`     No active admins`);
                }
            });
        }
        else {
            console.log('❌ Public endpoint failed:', data.message);
        }
    }
    catch (error) {
        console.error('❌ Error testing public endpoint:', error);
    }
};
testPublicEndpoint();
//# sourceMappingURL=testPublicEndpoint.js.map