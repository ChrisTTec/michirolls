const express = require("express");
const app = express();
const db = require("./db");
const cors = require("cors");
const path = require("path");

app.use(express.json({ limit: "10mb" }));
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

/* =========================
   🏠 FRONT
========================= */
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* =========================
   🍣 PRODUCTOS CRUD
========================= */

// LISTAR PRODUCTOS
app.get("/productos", (req, res) => {

    db.query("SELECT * FROM productos ORDER BY id DESC", (err, productos) => {
        if (err) return res.status(500).json({ productos: [], extras: [] });
    
        db.query("SELECT * FROM extras ORDER BY id DESC", (err2, extras) => {
            if (err2) return res.status(500).json({ productos: [], extras: [] });
    
            // 🔥 DEBUG IMPORTANTE
            console.log("PRODUCTOS:", productos);
            console.log("EXTRAS:", extras);
    
            res.json({
                productos,
                extras
            });
        });
    });
    
    });
    
// CREAR PRODUCTO
app.post("/productos", (req, res) => {
    const { nombre, precio, categoria, imagen } = req.body;

    db.query(
        "INSERT INTO productos (nombre, precio, categoria, imagen) VALUES (?, ?, ?, ?)",
        [nombre, precio, categoria, imagen],
        (err) => {
            if (err) return res.status(500).send("error");
            res.json({ ok: true });
        }
    );
});

// EDITAR PRODUCTO
app.put("/productos/:id", (req, res) => {
    const { nombre, precio, categoria, imagen } = req.body;

    db.query(
        "UPDATE productos SET nombre=?, precio=?, categoria=?, imagen=? WHERE id=?",
        [nombre, precio, categoria, imagen, req.params.id],
        (err) => {
            if (err) return res.status(500).send("error");
            res.json({ ok: true });
        }
    );
});

// ELIMINAR PRODUCTO
app.delete("/productos/:id", (req, res) => {
    db.query(
        "DELETE FROM productos WHERE id=?",
        [req.params.id],
        (err) => {
            if (err) return res.status(500).send("error");
            res.json({ ok: true });
        }
    );
});

/* =========================
   🍣 HANDROLLS + EXTRAS (CORRECTO)
========================= */
app.get("/handrolls", (req, res) => {

    db.query(
        "SELECT * FROM productos WHERE categoria='handroll'",
        (err, productos) => {
            if (err) return res.status(500).json([]);

            db.query("SELECT * FROM extras", (err2, extras) => {
                if (err2) return res.status(500).json([]);

                const data = productos.map(p => {
                    return {
                        ...p,
                        extras: extras.filter(e => e.producto_id === p.id)
                    };
                });

                res.json(data);
            });
        }
    );
});

/* =========================
   ➕ EXTRAS CRUD (IMPORTANTE)
========================= */

// agregar extra
app.post("/extras", (req, res) => {
    const { producto_id, nombre, precio } = req.body;

    db.query(
        "INSERT INTO extras (producto_id, nombre, precio) VALUES (?, ?, ?)",
        [producto_id, nombre, precio],
        (err) => {
            if (err) return res.status(500).send("error");
            res.json({ ok: true });
        }
    );
});

// eliminar extra
app.delete("/extras/:id", (req, res) => {
    db.query(
        "DELETE FROM extras WHERE id=?",
        [req.params.id],
        (err) => {
            if (err) return res.status(500).send("error");
            res.json({ ok: true });
        }
    );
});

/* =========================
   📦 PEDIDOS
========================= */
app.post("/pedido", (req, res) => {

    const { carrito, total, nombre, telefono, direccion, pago } = req.body;

    if (!carrito || carrito.length === 0) {
        return res.status(400).json({ error: "Carrito vacío" });
    }

    const codigo = "MR-" + Math.floor(1000 + Math.random() * 9000);

    db.query(
        "INSERT INTO pedidos (codigo, nombre, telefono, direccion, total, pago) VALUES (?, ?, ?, ?, ?, ?)",
        [codigo, nombre, telefono, direccion, total, pago],
        (err, result) => {

            if (err) {
                console.log(err);
                return res.status(500).send("error");
            }

            const pedido_id = result.insertId;

            carrito.forEach(p => {
                db.query(
                    "INSERT INTO detalle_pedido (pedido_id, producto_id, nombre, precio, extras, cantidad) VALUES (?, ?, ?, ?, ?, ?)",
                    [
                        pedido_id,
                        p.id || 0,
                        p.nombre,
                        p.precio,
                        (p.extras || []).join(", "),
                        1
                    ]
                );
            });

            res.json({ ok: true, codigo });
        }
    );
});


/* =========================
   📊 PEDIDOS ADMIN
========================= */
app.get("/pedidos", (req, res) => {

    db.query("SELECT * FROM pedidos ORDER BY id DESC", (err, pedidos) => {
        if (err) return res.status(500).json({ pedidos: [], detalles: [] });

        db.query("SELECT * FROM detalle_pedido", (err2, detalles) => {
            if (err2) return res.status(500).json({ pedidos: [], detalles: [] });

            res.json({ pedidos, detalles });
        });
    });
});

/* =========================
   🔄 ESTADO PEDIDO
========================= */
app.post("/estado", (req, res) => {

    const { id, estado } = req.body;

    db.query(
        "UPDATE pedidos SET estado=? WHERE id=?",
        [estado, id],
        (err) => {
            if (err) return res.status(500).send("error");
            res.send("OK");
        }
    );
});

/* =========================
   🔎 BUSCAR PEDIDO
========================= */
app.get("/buscar/:codigo", (req, res) => {

    db.query(
        "SELECT * FROM pedidos WHERE codigo=?",
        [req.params.codigo],
        (err, pedidos) => {

            if (err) return res.status(500).json(null);

            const pedido = pedidos[0];

            if (!pedido) return res.json(null);

            db.query(
                "SELECT * FROM detalle_pedido WHERE pedido_id=?",
                [pedido.id],
                (err2, detalle) => {

                    if (err2) return res.status(500).json(null);

                    res.json({
                        ...pedido,
                        detalle
                    });

                }
            );

        }
    );

});

/* =========================
   🚀 SERVER
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Servidor corriendo en puerto " + PORT);
});
