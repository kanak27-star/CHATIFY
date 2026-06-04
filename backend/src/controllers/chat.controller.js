import { generateStreamToken, upsertStreamUser } from "../lib/stream.js";
import User from "../models/User.js";

export async function getStreamToken(req,res){
  try{
    const rawTargetUserId = req.query.targetUserId;
    const targetUserId = typeof rawTargetUserId === "string" ? rawTargetUserId : undefined;

    if (rawTargetUserId && typeof rawTargetUserId !== "string") {
      console.warn("Invalid targetUserId query value:", rawTargetUserId);
    }

    await upsertStreamUser({
      id: req.user._id.toString(),
      name: req.user.fullName,
      image: req.user.profilePic || "",
    });

    if (targetUserId && targetUserId !== req.user._id.toString()) {
      const targetUser = await User.findById(targetUserId).select("fullName profilePic");
      if (!targetUser) {
        return res.status(404).json({ message: "Target user not found" });
      }

      await upsertStreamUser({
        id: targetUser._id.toString(),
        name: targetUser.fullName,
        image: targetUser.profilePic || "",
      });
    }

    const token = generateStreamToken({ userId: req.user._id });

    res.status(200).json({ token });
  }
  catch(error)
  {
    console.log("Error in getStreamToken controller",error.message);
    res.status(500).json({message:"Internal Server Error"});
  }
}