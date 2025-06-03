// src/main/ipc/akhrajatHandlers.js
import prisma from '../../../prisma/client.js';

const isUrdu = (text) => /^[\u0600-\u06FF\s]+$/.test(text);

const akhrajatHandlers = (ipcMain) => {
  ipcMain.handle("akhrajat:create", async (event, data) => {
    try {
      const { description, amount, transactionId } = data;
      if (!description || !transactionId) throw new Error("تفصیل یا لین دین کی شناخت غائب ہے");

      const newEntry = await prisma.akhrajat.create({
        data: {
          description,
          amount,
          transaction: { connect: { id: parseInt(transactionId) } },
        },
      });

      return newEntry;
    } catch (err) {
      console.error("Akhrajat Create Error:", err);
      throw new Error(err.message || "اخراجات شامل نہیں ہو سکے۔");
    }
  });

  ipcMain.handle("akhrajat:update", async (event, data) => {
    try {
      const { id, description, amount } = data;

      const parsedId = parseInt(id);
      if (isNaN(parsedId)) throw new Error("Invalid Akhrajat ID");

      if (description && !isUrdu(description)) {
        throw new Error("اخراجات کا نام صرف اردو میں درج کریں۔");
      }

      const updated = await prisma.akhrajat.update({
        where: { id: parsedId },
        data: { description, amount },
      });

      return updated;
    } catch (err) {
      console.error("Akhrajat Update Error:", err);
      throw new Error(err.message || "اخراجات کی تفصیل اپڈیٹ نہیں ہو سکی۔");
    }
  });

  ipcMain.handle("akhrajat:delete", async (event, id) => {
    try {
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) throw new Error("Invalid Akhrajat ID");

      const deleted = await prisma.akhrajat.delete({
        where: { id: parsedId },
      });

      return deleted;
    } catch (err) {
      console.error("Akhrajat Delete Error:", err);
      throw new Error(err.message || "اخراجات حذف کرنے میں ناکامی");
    }
  });
};

export default akhrajatHandlers;
