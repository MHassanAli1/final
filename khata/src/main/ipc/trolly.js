import prisma from '../../../prisma/client.js';

// Update Trolly Entry
const trollyHandlers = (ipcMain) => {
  ipcMain.handle("trollies:update", async (event, data) => {
    try {
      const { id, startNumber, endNumber, total } = data;

      const parsedId = parseInt(id);
      if (isNaN(parsedId)) throw new Error("Invalid Trolly ID");

      const updated = await prisma.trolly.update({
        where: { id: parseInt(id) },
        data: {
          StartingNum: startNumber,
          EndingNum: endNumber,
          total,
        },
      });

      return updated;
    } catch (err) {
      console.error("Trolly Update Error:", err);
      throw new Error(err.message || "ٹرالی کی تفصیل اپڈیٹ نہیں ہو سکی۔");
    }
  });

  ipcMain.handle("trollies:getByTransactionId", async (event, transactionId) => {
  try {
    const trollies = await prisma.trolly.findMany({
      where: { transactionId: parseInt(transactionId) },
    });
    return trollies;
  } catch (err) {
    console.error("Trolly Fetch Error:", err);
    throw new Error("ٹرالی کی معلومات حاصل نہیں ہو سکیں۔");
  }
});

};

export default trollyHandlers;
