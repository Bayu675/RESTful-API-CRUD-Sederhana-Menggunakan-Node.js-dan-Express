const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    Error.captureStackTrace(this, this.constructor);
  }
}

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

let biodataList = [
  {
    id: 1,
    nama: 'Bayu Oktovian',
    umur: 21,
    alamat: 'Tangerang, Banten',
    pekerjaan: 'Software Engineer & IT Infrastructure'
  },
  {
    id: 2,
    nama: 'Andi Pratama',
    umur: 24,
    alamat: 'Jakarta Selatan',
    pekerjaan: 'Network Administrator'
  }
];

let nextId = 3;

const validateBiodataPayload = (body) => {
  const { nama, umur, alamat, pekerjaan } = body;

  if (
    nama === undefined ||
    umur === undefined ||
    alamat === undefined ||
    pekerjaan === undefined
  ) {
    return 'Semua field (nama, umur, alamat, pekerjaan) wajib diisi.';
  }

  if (
    typeof nama !== 'string' ||
    nama.trim() === '' ||
    typeof alamat !== 'string' ||
    alamat.trim() === '' ||
    typeof pekerjaan !== 'string' ||
    pekerjaan.trim() === ''
  ) {
    return 'Field nama, alamat, dan pekerjaan harus berupa teks dan tidak boleh kosong.';
  }

  const parsedUmur = Number(umur);
  if (Number.isNaN(parsedUmur) || parsedUmur <= 0 || !Number.isInteger(parsedUmur)) {
    return 'Field umur harus berupa bilangan bulat positif yang valid.';
  }

  return null;
};

app.get(
  '/api/biodata',
  asyncHandler(async (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Berhasil mengambil seluruh data biodata.',
      data: biodataList
    });
  })
);

app.get(
  '/api/biodata/:id',
  asyncHandler(async (req, res, next) => {
    const id = parseInt(req.params.id, 10);

    if (Number.isNaN(id)) {
      return next(new AppError('Parameter ID harus berupa angka.', 400));
    }

    const biodata = biodataList.find((item) => item.id === id);

    if (!biodata) {
      return next(new AppError(`Data biodata dengan ID ${id} tidak ditemukan.`, 404));
    }

    res.status(200).json({
      status: 'success',
      message: `Berhasil mengambil detail biodata dengan ID ${id}.`,
      data: biodata
    });
  })
);

app.post(
  '/api/biodata',
  asyncHandler(async (req, res, next) => {
    const validationError = validateBiodataPayload(req.body);
    if (validationError) {
      return next(new AppError(validationError, 400));
    }

    const { nama, umur, alamat, pekerjaan } = req.body;

    const newBiodata = {
      id: nextId++,
      nama: nama.trim(),
      umur: Number(umur),
      alamat: alamat.trim(),
      pekerjaan: pekerjaan.trim()
    };

    biodataList.push(newBiodata);

    res.status(201).json({
      status: 'success',
      message: 'Data biodata baru berhasil ditambahkan.',
      data: newBiodata
    });
  })
);

app.put(
  '/api/biodata/:id',
  asyncHandler(async (req, res, next) => {
    const id = parseInt(req.params.id, 10);

    if (Number.isNaN(id)) {
      return next(new AppError('Parameter ID harus berupa angka.', 400));
    }

    const index = biodataList.findIndex((item) => item.id === id);

    if (index === -1) {
      return next(new AppError(`Data biodata dengan ID ${id} tidak ditemukan.`, 404));
    }

    const validationError = validateBiodataPayload(req.body);
    if (validationError) {
      return next(new AppError(validationError, 400));
    }

    const { nama, umur, alamat, pekerjaan } = req.body;

    const updatedBiodata = {
      id,
      nama: nama.trim(),
      umur: Number(umur),
      alamat: alamat.trim(),
      pekerjaan: pekerjaan.trim()
    };

    biodataList[index] = updatedBiodata;

    res.status(200).json({
      status: 'success',
      message: `Data biodata dengan ID ${id} berhasil diperbarui.`,
      data: updatedBiodata
    });
  })
);

app.delete(
  '/api/biodata/:id',
  asyncHandler(async (req, res, next) => {
    const id = parseInt(req.params.id, 10);

    if (Number.isNaN(id)) {
      return next(new AppError('Parameter ID harus berupa angka.', 400));
    }

    const index = biodataList.findIndex((item) => item.id === id);

    if (index === -1) {
      return next(new AppError(`Data biodata dengan ID ${id} tidak ditemukan.`, 404));
    }

    const deletedItems = biodataList.splice(index, 1);

    res.status(200).json({
      status: 'success',
      message: `Data biodata dengan ID ${id} berhasil dihapus.`,
      data: deletedItems[0]
    });
  })
);

app.use((req, res, next) => {
  next(new AppError(`Endpoint ${req.originalUrl} tidak ditemukan.`, 404));
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      status: 'fail',
      message: 'Format JSON pada request body tidak valid.',
      data: null
    });
  }

  const statusCode = err.statusCode || 500;
  const status = err.status || 'fail';

  res.status(statusCode).json({
    status,
    message: err.message || 'Terjadi kesalahan pada server.',
    data: null
  });
});

app.listen(PORT, () => {
  console.log(`Server RESTful API Biodata berjalan pada http://localhost:${PORT}`);
});