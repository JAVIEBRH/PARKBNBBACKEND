import Vehicle from '../../models/Vehicle.js';
import { NotFoundError, ForbiddenError } from '../../utils/errors.js';
import { uploadImage, deleteImage } from '../../libs/storage/cloudinary.js';
import { getPaginationParams } from '../../utils/pagination.js';

export const getVehicles = async (userId, query) => {
  const { page, limit, skip, sort } = getPaginationParams(query);

  const vehicles = await Vehicle.find({ owner: userId })
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Vehicle.countDocuments({ owner: userId });

  return {
    vehicles,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const createVehicle = async (userId, data) => {
  const vehicle = await Vehicle.create({
    ...data,
    owner: userId,
  });

  return vehicle;
};

export const getVehicleById = async (vehicleId, userId) => {
  const vehicle = await Vehicle.findById(vehicleId);

  if (!vehicle) {
    throw new NotFoundError('Vehículo no encontrado');
  }

  if (vehicle.owner.toString() !== userId) {
    throw new ForbiddenError('No tienes permiso para ver este vehículo');
  }

  return vehicle;
};

export const updateVehicle = async (vehicleId, userId, data) => {
  const vehicle = await Vehicle.findById(vehicleId);

  if (!vehicle) {
    throw new NotFoundError('Vehículo no encontrado');
  }

  if (vehicle.owner.toString() !== userId) {
    throw new ForbiddenError('No tienes permiso para actualizar este vehículo');
  }

  Object.assign(vehicle, data);

  await vehicle.save();

  return vehicle;
};

export const deleteVehicle = async (vehicleId, userId) => {
  const vehicle = await Vehicle.findById(vehicleId);

  if (!vehicle) {
    throw new NotFoundError('Vehículo no encontrado');
  }

  if (vehicle.owner.toString() !== userId) {
    throw new ForbiddenError('No tienes permiso para eliminar este vehículo');
  }

  // Delete photos
  for (const photo of vehicle.photos) {
    if (photo.publicId) {
      await deleteImage(photo.publicId).catch((err) =>
        console.error('Error deleting photo:', err)
      );
    }
  }

  await vehicle.deleteOne();

  return { success: true };
};

export const addPhoto = async (vehicleId, userId, file) => {
  const vehicle = await Vehicle.findById(vehicleId);

  if (!vehicle) {
    throw new NotFoundError('Vehículo no encontrado');
  }

  if (vehicle.owner.toString() !== userId) {
    throw new ForbiddenError('No tienes permiso para agregar fotos a este vehículo');
  }

  const result = await uploadImage(file.buffer, 'vehicles');

  vehicle.photos.push({
    url: result.url,
    publicId: result.publicId,
    order: vehicle.photos.length,
  });

  await vehicle.save();

  return vehicle;
};

export const deletePhoto = async (vehicleId, photoId, userId) => {
  const vehicle = await Vehicle.findById(vehicleId);

  if (!vehicle) {
    throw new NotFoundError('Vehículo no encontrado');
  }

  if (vehicle.owner.toString() !== userId) {
    throw new ForbiddenError('No tienes permiso para eliminar fotos de este vehículo');
  }

  const photo = vehicle.photos.id(photoId);

  if (!photo) {
    throw new NotFoundError('Foto no encontrada');
  }

  if (photo.publicId) {
    await deleteImage(photo.publicId).catch((err) => console.error('Error deleting photo:', err));
  }

  vehicle.photos.pull(photoId);

  await vehicle.save();

  return { success: true };
};

