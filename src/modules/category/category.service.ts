import { prisma } from "../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import { ICreateCategory, IUpdateCategory, ICategoryFilterRequest } from './category.interface'; 

const createCategory = async (payload: ICreateCategory) => {
  const slug = payload.name.toLowerCase().replace(/\s+/g, '-');

  const existingCategory = await prisma.category.findUnique({
    where: { slug },
  });

  if (existingCategory) {
    throw new Error('Category already exists');
  }

  const result = await prisma.category.create({
    data: {
      ...payload,
      slug,
    },
  });

  return result;
};

const getAllCategories = async (filters: ICategoryFilterRequest) => {
  const { search, isActive } = filters;
  
  const andConditions: Prisma.CategoryWhereInput[] = [];

  
  if (search) {
    andConditions.push({
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    });
  }


  if (isActive !== undefined) {
    andConditions.push({
      isActive: isActive,
    });
  }

  
  const whereConditions: Prisma.CategoryWhereInput = 
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.category.findMany({
    where: whereConditions,
    include: {
      _count: {
        select: { services: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return result;
};

const getCategoryById = async (id: string) => {
  const result = await prisma.category.findUnique({
    where: { id },
    include: {
      services: true,
    },
  });

  if (!result) {
    throw new Error('Category not found');
  }

  return result;
};

const updateCategory = async (id: string, payload: IUpdateCategory) => {
  const existingCategory = await prisma.category.findUnique({
    where: { id },
  });

  if (!existingCategory) {
    throw new Error('Category not found');
  }

  let slug = existingCategory.slug;

  
  if (payload.name) {
    slug = payload.name.toLowerCase().replace(/\s+/g, '-');
    
    const slugConflict = await prisma.category.findFirst({
      where: { slug, id: { not: id } },
    });

    if (slugConflict) {
      throw new Error('Category with this name already exists');
    }
  }

  const result = await prisma.category.update({
    where: { id },
    data: {
      ...payload,
      slug,
    },
  });

  return result;
};

const deleteCategory = async (id: string) => {
  const existingCategory = await prisma.category.findUnique({
    where: { id },
  });

  if (!existingCategory) {
    throw new Error('Category not found');
  }

  const result = await prisma.category.delete({
    where: { id },
  });

  return result;
};

export const CategoryService = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};









