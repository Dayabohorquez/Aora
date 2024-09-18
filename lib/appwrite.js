import {
  Account,
  Avatars,
  Client,
  Databases,
  ID,
  Query,
  Storage,
} from 'react-native-appwrite';

export const config = {
    endpoint: 'https://cloud.appwrite.io/v1',
    platform: 'com.jsm.aora',
    projectId: '66c7bd660034fa086fc1',
    databaseId: '66c7bfa90032e2258f7d',
    userCollectionId: '66c7bff200295b591254',
    videoCollectionId: '66c7c0450014fcbcf94a',
    storageId: '66c7c2c900354355240d',
};

const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setPlatform(config.platform);

const account = new Account(client);
const storage = new Storage(client);
const avatars = new Avatars(client);
const databases = new Databases(client);

// Sign up
export async function createUser(email, password, username) {
    try {
        const newAccount = await account.create(
            ID.unique(),
            email,
            password,
            username
        );

        if (!newAccount) throw Error('Account creation failed');

        const avatarUrl = avatars.getInitials(username);

        await signIn(email, password);

        const newUser = await databases.createDocument(
            config.databaseId,
            config.userCollectionId,
            ID.unique(),
            {
                accountid: newAccount.$id,
                email: email,
                username: username,
                avatar: avatarUrl,
            }
        );

        return newUser;
    } catch (error) {
        throw new Error(error.message);
    }
}

// Sign In
export async function signIn(email, password) {
    try {
        // Intentar obtener la sesión actual
        await account.getSession('current');
        console.log('User already has an active session.');
        return;
    } catch (error) {
        if (error.code !== 401) {
            // Re-throw error if it's not due to unauthorized access
            throw new Error('Error checking session status: ' + error.message);
        }
    }

    try {
        // Si no hay sesión activa, crear una nueva sesión
        const session = await account.createEmailPasswordSession(email, password);
        return session;
    } catch (error) {
        console.error('Error signing in:', error.message);
        throw new Error('Sign in failed: ' + error.message);
    }
}

// Get Account
export async function getAccount() {
    try {
        const currentAccount = await account.get();

        return currentAccount;
    } catch (error) {
        throw new Error(error.message);
    }
}

// Get Current User
export async function getCurrentUser() {
  try {
      const currentAccount = await getAccount();
      if (!currentAccount) throw new Error('No account found');

      const currentUser = await databases.listDocuments(
          config.databaseId,
          config.userCollectionId,
          [Query.equal('accountid', currentAccount.$id)]
      );

      if (!currentUser || currentUser.documents.length === 0) throw new Error('No user found');

      return currentUser.documents[0];
  } catch (error) {
      console.error('Error getting current user:', error.message);
      return null; // Ensure that you return null if there's an error
  }
}


// Sign Out
export async function signOut() {
    try {
        await account.deleteSession('current');
        console.log('Session closed successfully.');
    } catch (error) {
        console.error('Error signing out:', error.message);
        throw new Error(error.message);
    }
}

// Upload File
export async function uploadFile(file, type) {
    if (!file) return;
  
    const { mimeType, ...rest } = file;
    const asset = { type: mimeType, ...rest };
  
    try {
      const uploadedFile = await storage.createFile(
        config.storageId,
        ID.unique(),
        asset
      );
  
      const fileUrl = await getFilePreview(uploadedFile.$id, type);
      return fileUrl;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  
  // Get File Preview
  export async function getFilePreview(fileId, type) {
    let fileUrl;
  
    try {
      if (type === "video") {
        fileUrl = storage.getFileView(config.storageId, fileId);
      } else if (type === "image") {
        fileUrl = storage.getFilePreview(
          config.storageId,
          fileId,
          2000,
          2000,
          "top",
          100
        );
      } else {
        throw new Error("Invalid file type");
      }
  
      if (!fileUrl) throw new Error("Failed to get file preview");
  
      return fileUrl;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  
  // Create Video Post
  export async function createVideoPost(form) {
    try {
      const [thumbnailUrl, videoUrl] = await Promise.all([
        uploadFile(form.thumbnail, "image"),
        uploadFile(form.video, "video"),
      ]);
  
      const newPost = await databases.createDocument(
        config.databaseId,
        config.videoCollectionId,
        ID.unique(),
        {
          tittle: form.tittle,
          thumbnail: thumbnailUrl,
          video: videoUrl,
          prompt: form.prompt,
          creator: form.userId,
        }
      );
  
      return newPost;
    } catch (error) {
      throw new Error(error);
    }
  }
  
  // Get all video Posts
  export async function getAllPosts() {
    try {
      const posts = await databases.listDocuments(
        config.databaseId,
        config.videoCollectionId
      );
  
      return posts.documents;
    } catch (error) {
      throw new Error(error);
    }
  }
  
  // Get video posts created by user
  export async function getUserPosts(userId) {
    try {
      const posts = await databases.listDocuments(
        config.databaseId,
        config.videoCollectionId,
        [Query.equal("creator", userId)]
      );
  
      return posts.documents;
    } catch (error) {
      throw new Error(error);
    }
  }
  
  // Get video posts that matches search query
  export async function searchPosts(query) {
    try {
      const posts = await databases.listDocuments(
        config.databaseId,
        config.videoCollectionId,
        [Query.search("tittle", query)]
      );
  
      if (!posts) throw new Error("Something went wrong");
  
      return posts.documents;
    } catch (error) {
      throw new Error(error);
    }
  }
  
  // Get latest created video posts
  export async function getLatestPosts() {
    try {
      const posts = await databases.listDocuments(
        config.databaseId,
        config.videoCollectionId,
        [Query.orderDesc("$createdAt"), Query.limit(7)]
      );
  
      return posts.documents;
    } catch (error) {
      throw new Error(error);
    }
  }