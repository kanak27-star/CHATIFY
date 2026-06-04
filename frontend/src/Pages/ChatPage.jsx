import { useEffect, useState } from "react";
import { useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";

import {
  AttachmentSelector,
  Channel,
  ChannelHeader,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
  defaultAttachmentSelectorActionSet,
} from "stream-chat-react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";

import ChatLoader from "../Components/ChatLoader";
import CallButton from "../Components/CallButton";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const fileOnlyAttachmentSelectorActionSet =
  defaultAttachmentSelectorActionSet.filter(
    (action) => action.type === "uploadFile",
  );

const FileOnlyAttachmentSelector = () => (
  <AttachmentSelector
    attachmentSelectorActionSet={fileOnlyAttachmentSelectorActionSet}
  />
);

const ChatPage = () => {
  const { id: targetUserId } = useParams();

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  const { authUser } = useAuthUser();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken", targetUserId],
    queryFn: ({ queryKey }) => getStreamToken(queryKey[1]),
    enabled: !!authUser && !!targetUserId, // run only when authUser and target user id are available
  });

  useEffect(() => {
    let clientInstance;
    let mounted = true;

    const initChat = async () => {
      if (!tokenData?.token || !authUser) return;

      try {
        console.log("Initializing stream chat client...");

        const currentUserId = authUser._id.toString();
        const targetId = targetUserId.toString();

        clientInstance = StreamChat.getInstance(STREAM_API_KEY);

        await clientInstance.connectUser(
          {
            id: currentUserId,
            name: authUser.fullName,
            image: authUser.profilePic || "",
          },
          tokenData.token,
        );

        const channelId = [currentUserId, targetId].sort().join("-");
        const channelMembers = Array.from(new Set([currentUserId, targetId]));

        const currChannel = clientInstance.channel("messaging", channelId, {
          members: channelMembers,
          created_by_id: currentUserId,
        });

        try {
          await currChannel.watch();
        } catch (watchError) {
          console.warn(
            "Channel watch failed, attempting recovery:",
            watchError,
          );

          try {
            await currChannel.create();
            await currChannel.watch();
          } catch (createError) {
            console.warn(
              "Channel create failed, attempting member recovery:",
              createError,
            );
            const missingMembers = channelMembers.filter(
              (memberId) => !currChannel.state.members?.[memberId],
            );

            if (missingMembers.length) {
              await currChannel.addMembers(missingMembers);
              await currChannel.watch();
            } else {
              throw createError;
            }
          }
        }

        const missingMembers = channelMembers.filter(
          (memberId) => !currChannel.state.members?.[memberId],
        );

        if (missingMembers.length) {
          await currChannel.addMembers(missingMembers);
          await currChannel.watch();
        }

        if (mounted) {
          setChatClient(clientInstance);
          setChannel(currChannel);
        } else {
          await clientInstance.disconnectUser();
        }
      } catch (error) {
        console.error("Error initializing chat:", error);
        toast.error("Could not connect to chat. Please try again.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initChat();

    return () => {
      mounted = false;
      if (clientInstance) {
        clientInstance.disconnectUser().catch((disconnectError) => {
          console.warn("Error disconnecting Stream client:", disconnectError);
        });
      }
    };
  }, [tokenData, authUser, targetUserId]);

  const handleVideoCall = async () => {
    if (channel) {
      const callUrl = `${window.location.origin}/call/${channel.id}`;

      try {
        await channel.sendMessage({
          text: `I've started a video call. Join me here: ${callUrl}`,
        });
        toast.success("Video call link sent successfully!");
      } catch (error) {
        console.error("Error sending call message:", error);
        toast.error("Could not send video call link.");
      }
    }
  };

  if (loading || !chatClient || !channel) return <ChatLoader />;

  return (
    <div className="h-[93vh]">
      <Chat client={chatClient}>
        <Channel
          channel={channel}
          AttachmentSelector={FileOnlyAttachmentSelector}
          PollCreationDialog={() => null}
          ShareLocationDialog={() => null}
        >
          <div className="w-full relative">
            <CallButton handleVideoCall={handleVideoCall} />
            <Window>
              <ChannelHeader />
              <MessageList />
              <MessageInput focus />
            </Window>
          </div>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
};
export default ChatPage;
