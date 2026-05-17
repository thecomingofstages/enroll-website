require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./src/app/models/User.model');
const Activity = require('./src/app/models/Activity.model');
const Speaker = require('./src/app/models/Speaker.model');
const Registration = require('./src/app/models/Registration.model');
const Payment = require('./src/app/models/Payment.model');

async function seedDatabase() {
  const mongoURI = process.env.MONGO_URI;

  try {
    console.log('⏳ Connecting to database for seeding...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected. Clearing existing test data...');

    // Optional: Wipe out existing data in these collections so you don't get duplicates
    await Promise.all([
      User.deleteMany({}),
      Activity.deleteMany({}),
      Speaker.deleteMany({}),
      Registration.deleteMany({}),
      Payment.deleteMany({})
    ]);

    console.log('🌱 Starting seed operation...');

    // 1. Create a User
    const user = await User.create({
      first_name: "John",
      last_name: "Doe",
      nickname: "JD",
      email: "john.doe6767@example.com",
      phone: "0812345678",
      password_hash: "$2b$10$xyzSomeFakeHashedPasswordString", // Simulated hash
      gender: "Male",
      interests: ["Web Development", "UI/UX Design"],
      profile_image_url: "https://example.com/profiles/john.jpg"
    });
    console.log(`👤 User created with ID: ${user._id}`);

    // 2. Create an Activity
    const activity = await Activity.create({
      name: "67676767 Bootcamp",
      description: "An intensive hands-on bootcamp covering Express, Mongoose, and Next.js.",
      hero_image_url: "https://example.com/banners/bootcamp.jpg",
      price: 1500,
      seat_capacity: 40,
      tags: ["NodeJS", "MongoDB", "Backend"],
      benefits: ["Certificate of Completion", "1-on-1 Code Review", "Lifetime Access"],
      is_registration_open: true,
      is_featured: true,
      schedule: [
        {
          date: new Date("2026-06-15T09:00:00Z"),
          venue: "Main Auditorium, Hall 3",
          slots: [
            {
              start_time: "09:00",
              end_time: "12:00",
              title: "Introduction to Mongoose Schemas",
              description: "Deep dive into collections, validations, and hooks."
            }
          ]
        }
      ],
      extra_questions: [
        {
          question_id: "q_tshirt_size",
          question_text: "What is your T-Shirt size?",
          type: "single_choice",
          options: ["S", "M", "L", "XL"],
          is_required: true
        }
      ]
    });
    console.log(`🚀 Activity created with ID: ${activity._id}`);

    // 3. Create a Speaker (Linked to the Activity)
    const speaker = await Speaker.create({
      activity_id: activity._id,
      name: "Dr. Alice Smith",
      role: "Principal Software Engineer at Google",
      image_url: "https://example.com/speakers/alice.jpg"
    });
    console.log(`🎤 Speaker created with ID: ${speaker._id}`);

    // 4. Create a Registration (Linked to the User and Activity)
    const registration = await Registration.create({
      user_id: user._id,          // References our user
      activity_id: activity._id,  // References our activity
      status: "PENDING",
      group_name: "CodeWarriors Team",
      custom_answers: [
        {
          question_id: "q_tshirt_size",
          answer: "L"
        }
      ]
    });
    console.log(`📝 Registration created with ID: ${registration._id}`);

    // 5. Create a Payment (Linked to the Registration and User)
    const payment = await Payment.create({
      registration_id: registration._id, // References our registration
      user_id: user._id,                  // References our user
      amount: activity.price,             // 1500
      promptpay_qr_data: "00020101021130340016A00000067701011102130066812345678540415005802TH",
      status: "WAITING"
    });
    console.log(`💰 Payment record created with ID: ${payment._id}`);

    console.log('\n✨ Database seeding completed successfully! All models initialized.');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    // Always close the connection when a standalone script finishes execution
    await mongoose.connection.close();
    console.log('🔌 Database connection closed gracefully.');
  }
}

seedDatabase();