import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from './models/User.js'

dotenv.config()

const seedAdmin = async () => {
  try {

    await mongoose.connect(process.env.MONGODB_URI)

    console.log('MongoDB connected')

    // Check existing admin
    const existing = await User.findOne({
      email: 'pritamrba@gmail.com'
    })

    if (existing) {
      console.log('Admin already exists')
      process.exit()
    }

    // Create admin
    const admin = new User({
      name: 'Pritam Rabha',
      email: 'pritamrba@gmail.com',
      password: 'P7r7i4t8@'
    })

    await admin.save()

    console.log('Admin created successfully')

    process.exit()

  } catch (error) {

    console.error(error)

    process.exit(1)
  }
}

seedAdmin()