import prisma from '../../../prisma/client.js';

// Validate Urdu-only fields
const isUrdu = (text) => /^[\u0600-\u06FF\s]+$/.test(text);

const transactionHandlers = (ipcMain) => {
  ipcMain.handle('transactions:create', async (event, data) => {
    try {
      const {
        userID,
        ZoneName,
        KhdaName,
        KulAmdan,
        date,
        KulAkhrajat,
        KulMaizan,
        SaafiAmdan,
        Exercise,
        StartingNum,
        EndingNum,
        total,
        akhrajat = [],
      } = data;

      if (!isUrdu(ZoneName) || !isUrdu(KhdaName)) {
        throw new Error("زون اور کھدہ کا نام صرف اردو میں ہونا چاہیے۔");
      }

      const transaction = await prisma.transaction.create({
        data: {
          userID,
          ZoneName,
          KhdaName,
          KulAmdan: BigInt(KulAmdan),
          KulAkhrajat: BigInt(KulAkhrajat),
          KulMaizan: BigInt(KulMaizan),
          SaafiAmdan: BigInt(SaafiAmdan),
          Exercise: BigInt(Exercise),
          date: date ? new Date(date) : new Date(),
          trollies: {
            create: [{
              total: Number(total),
              StartingNum: BigInt(StartingNum),
              EndingNum: BigInt(EndingNum),
            }],
          },
          akhrajat: {
            create: akhrajat
              .filter(a => a.description && a.amount)
              .map(a => ({
                description: a.description,
                amount: BigInt(a.amount),
              })),
          }
        },
        include: {
          trollies: true,
          akhrajat: true,
        },
      });

      return transaction;
    } catch (err) {
      console.error("Transaction creation failed:", err);
      throw new Error(err.message || "معاملہ بنانے میں ناکامی");
    }
  });

  ipcMain.handle('transactions:getLastEndingNumber', async () => {
    const lastTrolly = await prisma.trolly.findFirst({
      orderBy: { EndingNum: 'desc' },
    });
    return lastTrolly?.EndingNum || 0n;
  });

  ipcMain.handle("transactions:getAll", async () => {
    try {
      return await prisma.transaction.findMany({
        include: { trollies: true, akhrajat: true },
      });
    } catch (err) {
      console.error("Get All Error:", err);
      throw new Error("Failed to fetch transactions");
    }
  });

  ipcMain.handle("transactions:getById", async (event, id) => {
    try {
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) throw new Error("Invalid ID");

      return await prisma.transaction.findUnique({
        where: { id: parsedId },
        include: { trollies: true, akhrajat: true },
      });
    } catch (err) {
      console.error("Get By ID Error:", err);
      throw new Error("Failed to get transaction");
    }
  });

  ipcMain.handle("transactions:update", async (event, { id, ...data }) => {
    try {
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) throw new Error("Invalid ID");

      const { ZoneName, KhdaName, date } = data;

      if (ZoneName && !isUrdu(ZoneName)) {
        throw new Error("صرف اردو میں زون کے نام درج کریں۔");
      }

      if (KhdaName && !isUrdu(KhdaName)) {
        throw new Error("صرف اردو میں کھدہ کے نام درج کریں۔");
      }

      return await prisma.transaction.update({
        where: { id: parsedId },
        data: {
          ZoneName,
          KhdaName,
          KulAmdan: data.KulAmdan ? BigInt(data.KulAmdan) : undefined,
          KulAkhrajat: data.KulAkhrajat ? BigInt(data.KulAkhrajat) : undefined,
          KulMaizan: data.KulMaizan ? BigInt(data.KulMaizan) : undefined,
          SaafiAmdan: data.SaafiAmdan ? BigInt(data.SaafiAmdan) : undefined,
          Exercise: data.Exercise ? BigInt(data.Exercise) : undefined,
          date: date ? new Date(date) : undefined,
        },
      });
    } catch (err) {
      console.error("Update Transaction Error:", err);
      throw new Error(err.message || "Update failed");
    }
  });

  ipcMain.handle("transactions:delete", async (event, id) => {
    try {
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) throw new Error("Invalid ID");

      await prisma.akhrajat.deleteMany({ where: { transactionId: parsedId } });
      await prisma.trolly.deleteMany({ where: { transactionId: parsedId } });

      return await prisma.transaction.delete({ where: { id: parsedId } });
    } catch (err) {
      console.error("Delete Error:", err);
      throw new Error(err.message || "Failed to delete transaction");
    }
  });

  ipcMain.handle("transactions:search", async (event, query) => {
    try {
      if (!query || typeof query !== "string")
        throw new Error("Invalid search input");

      return await prisma.transaction.findMany({
        where: {
          OR: [
            { ZoneName: { contains: query, mode: "insensitive" } },
            { KhdaName: { contains: query, mode: "insensitive" } },
          ],
        },
        include: { trollies: true, akhrajat: true },
      });
    } catch (err) {
      console.error("Search Error:", err);
      throw new Error("Failed to search transactions");
    }
  });

  ipcMain.handle("transaction:getOne", async (event, id) => {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id },
        include: { trollies: true, akhrajat: true },
      });
      return transaction;
    } catch (err) {
      console.error("Fetch Transaction Error:", err);
      throw new Error("ٹرانزیکشن حاصل نہیں ہو سکی");
    }
  });
};

export default transactionHandlers;
