"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var database_1 = require("../database");
var router = express_1.default.Router();
router.get('/', function (req, res) {
    try {
        // List all tables
        var tables = database_1.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
        console.log('Database tables:', tables);
        // Get data from each table
        var dbStatus = {};
        for (var _i = 0, _a = tables; _i < _a.length; _i++) {
            var table = _a[_i];
            var count = database_1.db.prepare("SELECT COUNT(*) as count FROM ".concat(table.name)).get();
            var sample = database_1.db.prepare("SELECT * FROM ".concat(table.name, " LIMIT 1")).get();
            var schema = database_1.db.prepare("PRAGMA table_info(".concat(table.name, ")")).all();
            dbStatus[table.name] = {
                rowCount: count.count,
                schema: schema,
                sampleRow: sample
            };
        }
        res.json({
            numberOfTables: tables.length,
            tables: tables.map(function (t) { return t.name; }),
            details: dbStatus
        });
    }
    catch (error) {
        console.error('Error getting database status:', error);
        res.status(500).json({
            error: 'Failed to get database status',
            message: error.message
        });
    }
});
exports.default = router;
