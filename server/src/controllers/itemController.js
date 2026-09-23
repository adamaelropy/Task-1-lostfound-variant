import { Item } from '../models/Item.js';
import Joi from 'joi';

const categories = ['electronics', 'clothing', 'documents', 'accessories', 'other'];
const statuses = ['lost', 'found', 'claimed'];

const createSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow(''),
  category: Joi.string().valid(...categories),
  status: Joi.string().valid(...statuses),
  location: Joi.string().allow(''),
  reportedBy: Joi.string().hex().length(24)
}).required();

const updateSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string().allow(''),
  category: Joi.string().valid(...categories),
  status: Joi.string().valid(...statuses),
  location: Joi.string().allow(''),
  reportedBy: Joi.string().hex().length(24).allow(null)
}).min(1);

function populatedItemQuery(query) {
  return query.populate('reportedBy', 'name email');
}

function isDuplicateKeyError(err) {
  return err?.code === 11000;
}

// GET /api/items
// TODO: implement per README.md section 3.
export async function getAllItems(req, res, next) {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;

    const items = await populatedItemQuery(Item.find(filter).sort({ createdAt: -1 }));
    res.json({ items });
  } catch (err) { next(err); }
}

// GET /api/items/:id
// TODO: implement per README.md section 3.
export async function getItem(req, res, next) {
  try {
    const item = await populatedItemQuery(Item.findById(req.params.id));
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ item });
  } catch (err) { next(err); }
}

// POST /api/items
// TODO: implement per README.md section 3.
export async function createItem(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const item = await Item.create(value);
    await item.populate('reportedBy', 'name email');
    res.status(201).json({ item });
  } catch (err) {
    if (isDuplicateKeyError(err)) return res.status(409).json({ message: 'Item already reported at this location' });
    next(err);
  }
}

// PATCH /api/items/:id
// TODO: implement per README.md section 3.
export async function updateItem(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { $set: value },
      { new: true, runValidators: true }
    ).populate('reportedBy', 'name email');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ item });
  } catch (err) { next(err); }
}

// DELETE /api/items/:id
// TODO: implement per README.md section 3.
export async function deleteItem(req, res, next) {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
}
