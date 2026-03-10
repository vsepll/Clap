import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Configuración de la base de datos
const dbPath = path.join(__dirname, '../prisma/dev.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Inicialización de tablas
db.exec(`
  CREATE TABLE IF NOT EXISTS Grupo (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    color TEXT NOT NULL,
    orden INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS Cliente (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Pedido (
    id TEXT PRIMARY KEY,
    clienteId TEXT NOT NULL,
    grupoId TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    notas TEXT,
    imagenes TEXT,
    total REAL DEFAULT 0,
    sena REAL DEFAULT 0,
    fechaSena TEXT,
    fechaEntrega TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clienteId) REFERENCES Cliente(id) ON DELETE CASCADE,
    FOREIGN KEY (grupoId) REFERENCES Grupo(id) ON DELETE CASCADE
  );
`);

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Middleware para loguear peticiones (ayuda a ver si el celular llega al server)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} from ${req.ip}`);
    next();
});

// --- MIGRACIÓN ---
app.post('/api/migrate', (req, res) => {
    try {
        const { clientes, grupos } = req.body;
        console.log(`Migrating ${clientes.length} clients and ${grupos.length} groups...`);

        const insertGrupo = db.prepare('INSERT OR REPLACE INTO Grupo (id, nombre, color, orden) VALUES (?, ?, ?, ?)');
        const insertCliente = db.prepare('INSERT OR REPLACE INTO Cliente (id, nombre, whatsapp, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)');
        const insertPedido = db.prepare('INSERT INTO Pedido (id, clienteId, grupoId, descripcion, notas, imagenes, total, sena, fechaSena, fechaEntrega) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

        const migrate = db.transaction(() => {
            for (const g of grupos) {
                console.log(`Inserting grupo: ${g.nombre}`);
                insertGrupo.run(g.id, g.nombre, g.color, g.orden);
            }
            for (const c of clientes) {
                console.log(`Inserting cliente: ${c.nombre}`);
                insertCliente.run(c.id, c.nombre, c.whatsapp, c.createdAt, c.updatedAt);

                // Solo crear pedido si tiene contenido y el grupo existe
                if (c.descripcion || (c.total && c.total > 0)) {
                    // Verificar si el grupo existe para este cliente/pedido legacy
                    const grupoExists = db.prepare('SELECT id FROM Grupo WHERE id = ?').get(c.grupoId);
                    if (grupoExists) {
                        insertPedido.run(
                            crypto.randomUUID(),
                            c.id,
                            c.grupoId,
                            c.descripcion || 'Pedido Inicial',
                            c.notas || '',
                            JSON.stringify(c.imagenes || []),
                            c.total || 0,
                            c.sena || 0,
                            c.fechaSena || '',
                            c.fechaEntrega || ''
                        );
                    } else {
                        console.warn(`Skipping pedido for ${c.nombre}: Group ${c.grupoId} not found`);
                    }
                }
            }
        });

        migrate();
        console.log('Migration successful');
        res.json({ success: true });
    } catch (error) {
        console.error('Migration failed:', error);
        res.status(500).json({ error: 'Migration failed', details: String(error) });
    }
});

// --- GRUPOS ---
app.get('/api/grupos', (req, res) => {
    const rows = db.prepare('SELECT * FROM Grupo ORDER BY orden ASC').all();
    res.json(rows);
});

app.post('/api/grupos', (req, res) => {
    try {
        const id = crypto.randomUUID(); // UUID siempre generado en el servidor
        const { nombre, color, orden } = req.body;
        db.prepare('INSERT INTO Grupo (id, nombre, color, orden) VALUES (?, ?, ?, ?)').run(id, nombre, color, orden);
        res.json({ id, nombre, color, orden });
    } catch (error) {
        console.error('Error creating grupo:', error);
        res.status(500).json({ error: 'Failed to create grupo', details: String(error) });
    }
});

app.delete('/api/grupos/:id', (req, res) => {
    try {
        const info = db.prepare('DELETE FROM Grupo WHERE id = ?').run(req.params.id);
        if (info.changes === 0) {
            return res.status(404).json({ error: 'Grupo not found' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting grupo:', error);
        res.status(500).json({ error: 'Failed to delete grupo', details: String(error) });
    }
});

// --- CLIENTES ---
app.get('/api/clientes', (req, res) => {
    const rows = db.prepare('SELECT * FROM Cliente').all();
    res.json(rows);
});

app.post('/api/clientes', (req, res) => {
    const id = crypto.randomUUID();
    const { nombre, whatsapp } = req.body;
    const now = new Date().toISOString();
    db.prepare('INSERT INTO Cliente (id, nombre, whatsapp, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)').run(id, nombre, whatsapp, now, now);
    res.json({ id, nombre, whatsapp, createdAt: now, updatedAt: now });
});

app.put('/api/clientes/:id', (req, res) => {
    const { nombre, whatsapp } = req.body;
    const now = new Date().toISOString();
    db.prepare('UPDATE Cliente SET nombre = ?, whatsapp = ?, updatedAt = ? WHERE id = ?').run(nombre, whatsapp, now, req.params.id);
    res.json({ id: req.params.id, nombre, whatsapp, updatedAt: now });
});

app.delete('/api/clientes/:id', (req, res) => {
    db.prepare('DELETE FROM Cliente WHERE id = ?').run(req.params.id);
    res.status(204).send();
});

// --- PEDIDOS ---
app.get('/api/pedidos', (req, res) => {
    const rows = db.prepare('SELECT * FROM Pedido').all();
    const formatted = rows.map((p: any) => ({
        ...p,
        imagenes: JSON.parse(p.imagenes || '[]')
    }));
    res.json(formatted);
});

app.post('/api/pedidos', (req, res) => {
    try {
        const id = crypto.randomUUID();
        const { clienteId, grupoId, descripcion, notas, imagenes, total, sena, fechaSena, fechaEntrega } = req.body;
        const now = new Date().toISOString();
        db.prepare(`
        INSERT INTO Pedido (id, clienteId, grupoId, descripcion, notas, imagenes, total, sena, fechaSena, fechaEntrega, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, clienteId, grupoId, descripcion, notas, JSON.stringify(imagenes || []), total, sena, fechaSena, fechaEntrega, now, now);
        res.json({ id, clienteId, grupoId, descripcion, notas, imagenes, total, sena, fechaSena, fechaEntrega, createdAt: now, updatedAt: now });
    } catch (error) {
        console.error('Error creating pedido:', error);
        res.status(500).json({ error: 'Failed to create pedido', details: error });
    }
});

app.put('/api/pedidos/:id', (req, res) => {
    try {
        const { grupoId, descripcion, notas, imagenes, total, sena, fechaSena, fechaEntrega } = req.body;
        const now = new Date().toISOString();

        const updates: string[] = [];
        const params: any[] = [];

        if (grupoId !== undefined) { updates.push('grupoId = ?'); params.push(grupoId); }
        if (descripcion !== undefined) { updates.push('descripcion = ?'); params.push(descripcion); }
        if (notas !== undefined) { updates.push('notas = ?'); params.push(notas); }
        if (imagenes !== undefined) { updates.push('imagenes = ?'); params.push(JSON.stringify(imagenes)); }
        if (total !== undefined) { updates.push('total = ?'); params.push(total); }
        if (sena !== undefined) { updates.push('sena = ?'); params.push(sena); }
        if (fechaSena !== undefined) { updates.push('fechaSena = ?'); params.push(fechaSena); }
        if (fechaEntrega !== undefined) { updates.push('fechaEntrega = ?'); params.push(fechaEntrega); }

        updates.push('updatedAt = ?');
        params.push(now);
        params.push(req.params.id);

        db.prepare(`UPDATE Pedido SET ${updates.join(', ')} WHERE id = ?`).run(...params);
        res.json({ id: req.params.id, ...req.body, updatedAt: now });
    } catch (error) {
        console.error('Error updating pedido:', error);
        res.status(500).json({ error: 'Failed to update pedido' });
    }
});

app.delete('/api/pedidos/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM Pedido WHERE id = ?').run(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting pedido:', error);
        res.status(500).json({ error: 'Failed to delete pedido' });
    }
});

// --- STATIC FILES (producción: sirve el build de Vite) ---
const distPath = path.resolve(__dirname, '..', 'dist');
console.log(`Serving static files from: ${distPath}`);
app.use(express.static(distPath));
// SPA fallback: cualquier ruta no-API devuelve index.html (Express 5: usar /*splat)
app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});

// Keep the process alive (better-sqlite3 WAL mode can interfere with Node's event loop on Windows)
server.on('error', (err) => {
    console.error('Server error:', err);
});

// Heartbeat to prevent process exit
setInterval(() => {}, 1 << 30);
