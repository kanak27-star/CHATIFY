import { upsertStreamUser } from "../lib/stream.js";
//import bcrypt from "bcryptjs";
import User from "../models/User.js"
import jwt from "jsonwebtoken"

export async  function signup(req,res){
  const { email,password,fullName } = req.body

  try{
    if(!email || !password || !fullName)
    {
      return res.status(400).json({message:"All fields are required"});
    }

    if(password.length<6)
    {
      return res.status(400).json({message:"Password must be atleast 6 characters"});
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = await User.findOne({ email });
    if(existingUser){
      return res.status(400).json({message:"Email already exists,please use a different one"});
    }

    // generate a seeded avatar using DiceBear based on the user's full name
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`;

    const newUser = await User.create({
      email,
      fullName,
      password,
      profilePic: avatar,
    });
     
   try{
     await upsertStreamUser({
      id:newUser._id.toString(),
      name:newUser.fullName,
      image:newUser.profilePic || ""
    });
    console.log(`Stream user created for ${newUser.fullName}`)
   }
   catch(error){
    console.log("Error creating Stream user:",error);
   }




    const token = jwt.sign(
      {userId:newUser._id},
      process.env.JWT_SECRET_KEY,
      {
      expiresIn:"7d"
      });

    const cookieOptions = {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      path: "/",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      domain: process.env.NODE_ENV === "production" ? undefined : "localhost",
    };

    res.cookie("jwt", token, cookieOptions);

    res.status(201).json({success:true,user:newUser});
  }
  catch(error){
    console.log("Error in signup controller",error);
    res.status(500).json({message:"Internal server error"});
  }
}

export async function login(req,res){
  try{
     const { email,password } = req.body
     if(!email || !password)
       return res.status(400).json({message:"All fields are required"});

     const user = await User.findOne({email});
     if(!user)
        return res.status(401).json({message:"Invalid email or password"});

     const isPasswordCorrect = await user.matchPassword(password);
     if(!isPasswordCorrect) 
      return res.status(401).json({message:"Invalid email or password"});

    try {
      await upsertStreamUser({
        id: user._id.toString(),
        name: user.fullName,
        image: user.profilePic || "",
      });
      console.log(`Stream user ensured for ${user.fullName}`);
    } catch (streamError) {
      console.log("Error creating Stream user on login:", streamError);
    }

     const token = jwt.sign(
      {userId:user._id},
      process.env.JWT_SECRET_KEY,
      {
      expiresIn:"7d"
      });

    const cookieOptions = {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      path: "/",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      domain: process.env.NODE_ENV === "production" ? undefined : "localhost",
    };

    res.cookie("jwt", token, cookieOptions);

    res.status(200).json({success:true,user});
  }
  catch(error){
    console.log("Error in login controller",error.message);
    res.status(500).json({message:"Internal server error"});
  }
}

export  function logout(req,res){
  const cookieOptions = {
    httpOnly: true,
    path: "/",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    domain: process.env.NODE_ENV === "production" ? undefined : "localhost",
  };

  // Clear cookie with the same options used when setting it so browsers remove it correctly
  res.clearCookie("jwt", cookieOptions);
  res.status(200).json({success:true,message:"Logout successful"});
}

export async function onboard(req,res) {
  try{
    const userId = req.user._id;

    const { fullName,bio,nativeLanguage,learningLanguage,location }=req.body
    if(!fullName || !bio || !nativeLanguage || !learningLanguage || !location)
    {
      return res.status(400).json({
        message:" All feilds are required ",
        missingFeilds:[
          !fullName && "fullName",
          !bio && "bio",
          !nativeLanguage && "nativeLanguage",
          !learningLanguage && "learningLanguage",
          !location && "location",
        ].filter(Boolean)
      })
    }

    const updatedUser = await User.findByIdAndUpdate(userId,{
     ...req.body,
     isOnboarded:true,
    },{new:true});

    if(!updatedUser) 
      return res.status(404).json({message:"User not found"});

    try{
      await upsertStreamUser({
      id:updatedUser._id.toString(),
      name:updatedUser.fullName,
      image:updatedUser.profilePic || "",
    });

    console.log(`Stream user updated and onboarding for ${updatedUser.fullName}`);
    }
    catch(streamError)
    {
      console.log("Error updating Stream user during onboarding:",streamError.message);
    }


    res.status(200).json({success:true,user:updatedUser});
  }
  catch(error){
   console.error("Onboarding error:",error);
   res.status(500).json({message:"Internal Server Error"});
  }
}