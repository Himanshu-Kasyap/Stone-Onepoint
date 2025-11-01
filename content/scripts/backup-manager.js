#!/usr/bin/env node

/**
 * Content Backup and Versioning System
 * Manages backups and version control for website content
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class BackupManager {
    constructor() {
        this.contentDir = path.join(__dirname, '..');
        this.publicDir = path.join(__dirname, '../../public');
        this.backupDir = path.join(this.contentDir, 'backups');
        this.versionsFile = path.join(this.backupDir, 'versions.json');
        
        // Ensure backup directory exists
        fs.mkdirSync(this.backupDir, { recursive: true });
        
        this.versions = this.loadVersions();
    }

    loadVersions() {
        try {
            if (fs.existsSync(this.versionsFile)) {
                return JSON.parse(fs.readFileSync(this.versionsFile, 'utf8'));
            }
        } catch (error) {
            console.error('Error loading versions:', error.message);
        }
        
        return {
            current: null,
            versions: []
        };
    }

    saveVersions() {
        fs.writeFileSync(this.versionsFile, JSON.stringify(this.versions, null, 2));
    }

    generateHash(content) {
        return crypto.createHash('md5').update(content).digest('hex');
    }

    createBackup(description = 'Manual backup') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupId = `backup-${timestamp}`;
        const backupPath = path.join(this.backupDir, backupId);
        
        console.log(`🔄 Creating backup: ${backupId}`);
        
        // Create backup directory
        fs.mkdirSync(backupPath, { recursive: true });
        
        // Backup content data files
        const dataBackupPath = path.join(backupPath, 'data');
        fs.mkdirSync(dataBackupPath, { recursive: true });
        this.copyDirectory(path.join(this.contentDir, 'data'), dataBackupPath);
        
        // Backup templates
        const templatesBackupPath = path.join(backupPath, 'templates');
        fs.mkdirSync(templatesBackupPath, { recursive: true });
        this.copyDirectory(path.join(this.contentDir, 'templates'), templatesBackupPath);
        
        // Backup public HTML files
        const publicBackupPath = path.join(backupPath, 'public');
        fs.mkdirSync(publicBackupPath, { recursive: true });
        this.backupHTMLFiles(this.publicDir, publicBackupPath);
        
        // Generate backup manifest
        const manifest = this.generateManifest(backupPath);
        fs.writeFileSync(path.join(backupPath, 'manifest.json'), JSON.stringify(manifest, null, 2));
        
        // Update versions
        const version = {
            id: backupId,
            timestamp: new Date().toISOString(),
            description: description,
            hash: this.generateHash(JSON.stringify(manifest)),
            files: manifest.files.length,
            size: manifest.totalSize
        };
        
        this.versions.versions.unshift(version);
        this.versions.current = backupId;
        
        // Keep only last 10 backups
        if (this.versions.versions.length > 10) {
            const oldVersions = this.versions.versions.splice(10);
            oldVersions.forEach(oldVersion => {
                const oldBackupPath = path.join(this.backupDir, oldVersion.id);
                if (fs.existsSync(oldBackupPath)) {
                    this.removeDirectory(oldBackupPath);
                    console.log(`🗑️  Removed old backup: ${oldVersion.id}`);
                }
            });
        }
        
        this.saveVersions();
        
        console.log(`✅ Backup created successfully: ${backupId}`);
        console.log(`   Files: ${manifest.files.length}`);
        console.log(`   Size: ${this.formatBytes(manifest.totalSize)}`);
        
        return backupId;
    }

    copyDirectory(source, destination) {
        if (!fs.existsSync(source)) return;
        
        const items = fs.readdirSync(source);
        items.forEach(item => {
            const sourcePath = path.join(source, item);
            const destPath = path.join(destination, item);
            const stat = fs.statSync(sourcePath);
            
            if (stat.isDirectory()) {
                fs.mkdirSync(destPath, { recursive: true });
                this.copyDirectory(sourcePath, destPath);
            } else {
                fs.copyFileSync(sourcePath, destPath);
            }
        });
    }

    backupHTMLFiles(source, destination) {
        const items = fs.readdirSync(source);
        items.forEach(item => {
            const sourcePath = path.join(source, item);
            const stat = fs.statSync(sourcePath);
            
            if (stat.isDirectory()) {
                const destPath = path.join(destination, item);
                fs.mkdirSync(destPath, { recursive: true });
                this.backupHTMLFiles(sourcePath, destPath);
            } else if (item.endsWith('.html') || item === 'sitemap.xml' || item === 'robots.txt') {
                const destPath = path.join(destination, item);
                fs.copyFileSync(sourcePath, destPath);
            }
        });
    }

    removeDirectory(dirPath) {
        if (fs.existsSync(dirPath)) {
            fs.rmSync(dirPath, { recursive: true, force: true });
        }
    }

    generateManifest(backupPath) {
        const manifest = {
            id: path.basename(backupPath),
            timestamp: new Date().toISOString(),
            files: [],
            totalSize: 0
        };
        
        this.scanDirectory(backupPath, backupPath, manifest);
        return manifest;
    }

    scanDirectory(dirPath, basePath, manifest) {
        const items = fs.readdirSync(dirPath);
        items.forEach(item => {
            const fullPath = path.join(dirPath, item);
            const relativePath = path.relative(basePath, fullPath);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                this.scanDirectory(fullPath, basePath, manifest);
            } else {
                const content = fs.readFileSync(fullPath);
                manifest.files.push({
                    path: relativePath.replace(/\\/g, '/'),
                    size: stat.size,
                    hash: this.generateHash(content),
                    modified: stat.mtime.toISOString()
                });
                manifest.totalSize += stat.size;
            }
        });
    }

    restoreBackup(backupId) {
        const backupPath = path.join(this.backupDir, backupId);
        
        if (!fs.existsSync(backupPath)) {
            console.error(`❌ Backup not found: ${backupId}`);
            return false;
        }
        
        console.log(`🔄 Restoring backup: ${backupId}`);
        
        // Create a backup of current state before restoring
        this.createBackup(`Pre-restore backup before ${backupId}`);
        
        // Restore data files
        const dataBackupPath = path.join(backupPath, 'data');
        if (fs.existsSync(dataBackupPath)) {
            this.copyDirectory(dataBackupPath, path.join(this.contentDir, 'data'));
        }
        
        // Restore templates
        const templatesBackupPath = path.join(backupPath, 'templates');
        if (fs.existsSync(templatesBackupPath)) {
            this.copyDirectory(templatesBackupPath, path.join(this.contentDir, 'templates'));
        }
        
        // Restore public HTML files
        const publicBackupPath = path.join(backupPath, 'public');
        if (fs.existsSync(publicBackupPath)) {
            this.copyDirectory(publicBackupPath, this.publicDir);
        }
        
        this.versions.current = backupId;
        this.saveVersions();
        
        console.log(`✅ Backup restored successfully: ${backupId}`);
        return true;
    }

    listBackups() {
        console.log('📋 Available Backups:\n');
        
        if (this.versions.versions.length === 0) {
            console.log('No backups found.');
            return;
        }
        
        this.versions.versions.forEach((version, index) => {
            const isCurrent = version.id === this.versions.current;
            const marker = isCurrent ? '→' : ' ';
            const date = new Date(version.timestamp).toLocaleString();
            
            console.log(`${marker} ${index + 1}. ${version.id}`);
            console.log(`   Date: ${date}`);
            console.log(`   Description: ${version.description}`);
            console.log(`   Files: ${version.files}, Size: ${this.formatBytes(version.size)}`);
            console.log('');
        });
    }

    compareBackups(backupId1, backupId2) {
        const backup1Path = path.join(this.backupDir, backupId1, 'manifest.json');
        const backup2Path = path.join(this.backupDir, backupId2, 'manifest.json');
        
        if (!fs.existsSync(backup1Path) || !fs.existsSync(backup2Path)) {
            console.error('❌ One or both backups not found');
            return;
        }
        
        const manifest1 = JSON.parse(fs.readFileSync(backup1Path, 'utf8'));
        const manifest2 = JSON.parse(fs.readFileSync(backup2Path, 'utf8'));
        
        console.log(`📊 Comparing backups: ${backupId1} vs ${backupId2}\n`);
        
        const files1 = new Map(manifest1.files.map(f => [f.path, f]));
        const files2 = new Map(manifest2.files.map(f => [f.path, f]));
        
        const allPaths = new Set([...files1.keys(), ...files2.keys()]);
        const changes = [];
        
        allPaths.forEach(filePath => {
            const file1 = files1.get(filePath);
            const file2 = files2.get(filePath);
            
            if (!file1) {
                changes.push({ type: 'added', path: filePath });
            } else if (!file2) {
                changes.push({ type: 'deleted', path: filePath });
            } else if (file1.hash !== file2.hash) {
                changes.push({ type: 'modified', path: filePath });
            }
        });
        
        if (changes.length === 0) {
            console.log('✅ No differences found between backups.');
        } else {
            console.log(`Found ${changes.length} differences:\n`);
            
            const added = changes.filter(c => c.type === 'added');
            const deleted = changes.filter(c => c.type === 'deleted');
            const modified = changes.filter(c => c.type === 'modified');
            
            if (added.length > 0) {
                console.log(`➕ Added files (${added.length}):`);
                added.forEach(c => console.log(`   ${c.path}`));
                console.log('');
            }
            
            if (deleted.length > 0) {
                console.log(`➖ Deleted files (${deleted.length}):`);
                deleted.forEach(c => console.log(`   ${c.path}`));
                console.log('');
            }
            
            if (modified.length > 0) {
                console.log(`📝 Modified files (${modified.length}):`);
                modified.forEach(c => console.log(`   ${c.path}`));
                console.log('');
            }
        }
    }

    cleanupOldBackups(keepCount = 5) {
        console.log(`🧹 Cleaning up old backups (keeping ${keepCount})...`);
        
        if (this.versions.versions.length <= keepCount) {
            console.log('No cleanup needed.');
            return;
        }
        
        const toRemove = this.versions.versions.splice(keepCount);
        let removedCount = 0;
        
        toRemove.forEach(version => {
            const backupPath = path.join(this.backupDir, version.id);
            if (fs.existsSync(backupPath)) {
                this.removeDirectory(backupPath);
                removedCount++;
                console.log(`🗑️  Removed: ${version.id}`);
            }
        });
        
        this.saveVersions();
        console.log(`✅ Cleanup completed. Removed ${removedCount} old backups.`);
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// CLI interface
if (require.main === module) {
    const manager = new BackupManager();
    const command = process.argv[2];
    const arg1 = process.argv[3];
    const arg2 = process.argv[4];
    
    switch (command) {
        case 'create':
            manager.createBackup(arg1 || 'Manual backup');
            break;
        case 'restore':
            if (arg1) {
                manager.restoreBackup(arg1);
            } else {
                console.error('❌ Please specify backup ID to restore');
            }
            break;
        case 'list':
            manager.listBackups();
            break;
        case 'compare':
            if (arg1 && arg2) {
                manager.compareBackups(arg1, arg2);
            } else {
                console.error('❌ Please specify two backup IDs to compare');
            }
            break;
        case 'cleanup':
            const keepCount = arg1 ? parseInt(arg1) : 5;
            manager.cleanupOldBackups(keepCount);
            break;
        default:
            console.log(`
Backup Manager Usage:

  node backup-manager.js <command> [arguments]

Commands:
  create [description]     Create a new backup
  restore <backup-id>      Restore from backup
  list                     List all backups
  compare <id1> <id2>      Compare two backups
  cleanup [keep-count]     Remove old backups (default: keep 5)

Examples:
  node backup-manager.js create "Before major update"
  node backup-manager.js restore backup-2024-10-31T10-30-00-000Z
  node backup-manager.js list
  node backup-manager.js cleanup 3
            `);
    }
}

module.exports = BackupManager;