import connectDB from "./db/index.js";

connectDB();

// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URI} ${DB_NAME}`);
//     app.on("error", (error) => {
//       console.log("ERROR", error);
//       throw error;
//     });
//     app.listen(process.env.PORT, () => {
//       console.log(`App listening on Port ${process.env.PORT}`);
//     });
//   } catch (error) {
//     console.error("ERROR", error);
//   }
// })();
