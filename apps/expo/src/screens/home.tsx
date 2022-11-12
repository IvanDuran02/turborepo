import React, { useEffect } from "react";
import * as Device from "expo-device";
import * as NavigationBar from "expo-navigation-bar";

import {
  RefreshControl,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { FlashList } from "@shopify/flash-list";
import type { inferProcedureOutput } from "@trpc/server";
import type { AppRouter } from "@acme/api";

import { trpc } from "../utils/trpc";

const PostCard: React.FC<{
  post: inferProcedureOutput<AppRouter["post"]["all"]>[number];
}> = ({ post }) => {
  const utils = trpc.useContext();
  const mutation = trpc.post.remove.useMutation({
    async onSuccess() {
      await utils.post.all.invalidate();
      alert("message successfully deleted!");
    },
  });

  return (
    <View className="p-4 border-2 border-gray-500 rounded-lg flex-row items-center">
      <View className="grow">
        <Text className="text-xl font-semibold text-gray-800">
          {post.title}
        </Text>
        <Text className="text-gray-600">{post.content}</Text>
      </View>
      <Text className="text-red-600" onPress={() => mutation.mutate(post.id)}>
        X
      </Text>
    </View>
  );
};

const CreatePost: React.FC = () => {
  const utils = trpc.useContext();
  const { mutate } = trpc.post.create.useMutation({
    async onSuccess() {
      await utils.post.all.invalidate();
      alert("Post successfully sent!");
      onChangeTitle("");
      onChangeContent("");
    },
  });

  const [title, onChangeTitle] = React.useState("");
  const [content, onChangeContent] = React.useState("");

  return (
    <View className="p-4 border-t-2 border-gray-500 flex flex-col">
      <TextInput
        className="border-2 border-gray-500 rounded p-2 mb-2"
        onChangeText={onChangeTitle}
        value={title}
        placeholder="Title"
      />
      <TextInput
        className="border-2 border-gray-500 rounded p-2 mb-2"
        onChangeText={onChangeContent}
        value={content}
        placeholder="Content"
      />
      <TouchableOpacity
        className="bg-indigo-500 rounded p-2"
        onPress={() => {
          mutate({
            title,
            content,
          });
        }}
      >
        <Text className="text-white font-semibold">Publish post</Text>
      </TouchableOpacity>
    </View>
  );
};

// this function will determine how long to spin the refresh animation, specifially I set it to stop when the promise is resolved
const wait = () => {
  return new Promise((resolve) => setTimeout(resolve));
};

export const HomeScreen = () => {
  const device = Device.osName; // Android: "Android"; iOS: "iOS" or "iPadOS"; web: "iOS", "Android", "Windows"
  const postQuery = trpc.post.all.useQuery();

  // . showPost will give us post ID
  const [showPost, setShowPost] = React.useState<string | null>(null);
  const [header, setHeader] = React.useState(<Text>Hello, world</Text>);
  const [refreshing, setRefreshing] = React.useState(false);

  const utils = trpc.useContext();
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await utils.post.all.invalidate().then(() => {
      wait().then(() => setRefreshing(false));
    });
  }, []);

  useEffect(() => {
    if (device === "Android") {
      // for some reason there is no padding on the android so the text was covering the status bar
      setHeader(
        <Text className="text-5xl font-bold mx-auto pb-2 pt-10">
          Create <Text className="text-indigo-500">T3</Text> Turbo!
        </Text>
      );
      NavigationBar.setVisibilityAsync("visible"); // hides navigation bar by default
    } else if (device === "iOS") {
      setHeader(
        <Text className="text-5xl font-bold mx-auto pb-2">
          Create <Text className="text-indigo-500">T3</Text> Turbo
        </Text>
      );
    }
  }, []);
  return (
    <SafeAreaView>
      <View className="h-full w-full p-4">
        {header}
        <View className="py-2">
          {showPost ? (
            <Text>
              <Text className="font-semibold">Selected post:</Text>
              {showPost}
            </Text>
          ) : (
            <Text className="italic font-semibold">Press on a post</Text>
          )}
        </View>

        <FlashList
          data={postQuery.data}
          estimatedItemSize={20}
          ItemSeparatorComponent={() => <View className="h-2" />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={(p) => (
            <TouchableOpacity
              onPress={() => {
                setShowPost(p.item.id);
              }}
            >
              <PostCard post={p.item} />
            </TouchableOpacity>
          )}
        />

        <CreatePost />
      </View>
    </SafeAreaView>
  );
};
