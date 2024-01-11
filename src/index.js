import connectDB from "./db/index.js";
import app from "./app.js";

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`App is listening through port: ${process.env.PORT}`);
    });
    app.on("error", (error) => {
      console.log("Error on listening", error);
    });
  })
  .catch((error) => {
    console.log("!!!! connect DB ERROR !!!!", error);
  });

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
