import express from "express";
import CalendarController from "../controllers/calendarController.js";

const calendarRoutes = express.Router();

calendarRoutes.get("/evento", CalendarController.getEvents);
calendarRoutes.put("/evento", CalendarController.confirmEvent);
calendarRoutes.put("/evento", CalendarController.cancelEvent);

export default calendarRoutes;
