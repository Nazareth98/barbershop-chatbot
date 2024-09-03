import express from "express";
import calendarRoutes from "./calendarRoutes.js";
import CalendarController from "../controllers/calendarController.js";

const Router = express.Router();

Router.use("/agenda", calendarRoutes);
Router.get("/callback", CalendarController.getCallback);

export default Router;
