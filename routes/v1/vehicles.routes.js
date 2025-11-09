import { Router } from 'express';
import * as vehiclesController from '../../controllers/vehicles/vehicles.controller.js';
import { requireAuth } from '../../middlewares/auth.js';
import { requireDriver } from '../../middlewares/roles.js';

const router = Router();

router.use(requireAuth);
router.use(requireDriver);

router.get('/', vehiclesController.getVehicles);
router.post('/', vehiclesController.createVehicle);
router.get('/:vehicleId', vehiclesController.getVehicleById);
router.patch('/:vehicleId', vehiclesController.updateVehicle);
router.delete('/:vehicleId', vehiclesController.deleteVehicle);

router.post('/:vehicleId/photos', vehiclesController.addPhoto);
router.delete('/:vehicleId/photos/:photoId', vehiclesController.deletePhoto);

export default router;

