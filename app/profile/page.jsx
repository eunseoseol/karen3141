"use client";
import React, { useEffect, useState } from "react";
import { UserAuth } from "../context/AuthContext";
import { collection, getDocs, query, where, doc, deleteDoc, updateDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from './../firebase';
import Spinner from "../components/Spinner";
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns'; 
import { FiEdit, FiTrash2, FiEdit3 } from 'react-icons/fi';

const Page = () => {
  const { user } = UserAuth();
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState([]);
  const [profilePic, setProfilePic] = useState(null);
  const [bio, setBio] = useState('');
  const [socialLinks, setSocialLinks] = useState({
    instagram: '',
    threads: '',
    X: '',
    youtube: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('articles');

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        // Fetch articles
        const q = query(collection(db, 'JarvisArticle'), where('author', '==', user.email));
        const querySnapshot = await getDocs(q);
        const articlesData = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          const userDocRef = doc(db, 'users', data.author);
          const userDocSnapshot = await getDoc(userDocRef);
          const userData = userDocSnapshot.exists() ? userDocSnapshot.data() : { profile: { name: 'Unknown', profileImage: null } };
          return {
            id: docSnapshot.id,
            ...data,
            authorName: userData.profile?.name || 'Unknown',
            authorProfileImage: userData.profileImage || null
          };
        }));
        setArticles(articlesData);

        // Fetch user profile data
        const userDocRef = doc(db, 'users', user.email);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.profileImage) {
            setProfilePic(userData.profileImage);
          }
          if (userData.bio) {
            setBio(userData.bio);
          }
          if (userData.socialLinks) {
            setSocialLinks(userData.socialLinks);
          }
        }
      }
      setLoading(false);
    };
    fetchUserProfile();
  }, [user]);

  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const storageRef = ref(storage, `profilePictures/${user.email}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
        },
        (error) => {
          console.error("Error uploading file:", error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setProfilePic(downloadURL);

          // Save URL to Firestore
          const userDocRef = doc(db, 'users', user.email);
          await updateDoc(userDocRef, {
            profileImage: downloadURL,
          });
        }
      );
    }
  };

  const handleSaveProfile = async () => {
    const userDocRef = doc(db, 'users', user.email);
    await updateDoc(userDocRef, {
      bio,
      socialLinks,
    });
    alert("Profile updated successfully!");
    setIsEditing(false); // Exit editing mode
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'bio') {
      setBio(value);
    } else {
      setSocialLinks({
        ...socialLinks,
        [name]: value,
      });
    }
  };

  const extractPreviewText = (html) => {
    if (typeof document !== 'undefined') {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      const textContent = tempDiv.textContent || tempDiv.innerText || "";
      return textContent.substring(0, 200) + (textContent.length > 200 ? "..." : ""); // Display first 200 characters
    }
    return "";
  };

  const extractFirstImage = (html) => {
    if (typeof document !== 'undefined') {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      const img = tempDiv.querySelector("img");
      return img ? img.src : null;
    }
    return null;
  };

  const calculateReadTime = (text) => {
    const wordsPerMinute = 200;
    const words = text.split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this article?")) {
      try {
        await deleteDoc(doc(db, 'JarvisArticle', id));
        setArticles(articles.filter(article => article.id !== id));
        alert("Article deleted successfully.");
      } catch (error) {
        console.error("Error deleting article: ", error);
        alert("Error deleting article.");
      }
    }
  };

  return (
    <div className="content-container">
      <div className="p-4">
        {loading ? (
          <Spinner />
        ) : user ? (
          <div>
            <div className="flex items-center mb-4">
              {profilePic ? (
                <img
                  src={profilePic}
                  alt="Profile"
                  className="w-12 h-12 rounded-full mr-4"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-500 text-white flex items-center justify-center mr-4">
                  {user.displayName.slice(0, 2)}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold">{user.displayName}</h2>
                <label className="text-blue-500 cursor-pointer">
                  프로필 사진 설정
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfilePicChange}
                  />
                </label>
              </div>
            </div>
            <div className="tabs flex justify-end space-x-4 mb-4">
              <button
                className={`tab p-2 ${activeTab === 'articles' ? 'active bg-blue-100 border-b-2 border-blue-500' : 'hover:bg-gray-200'}`}
                onClick={() => setActiveTab('articles')}
              >
                나의 아티클
              </button>
              <button
                className={`tab p-2 ${activeTab === 'profile' ? 'active bg-blue-100 border-b-2 border-blue-500' : 'hover:bg-gray-200'}`}
                onClick={() => setActiveTab('profile')}
              >
                나의 소개
              </button>
            </div>
            {activeTab === 'articles' && (
              <div className="articles">
                {articles.map(article => (
                  <Link key={article.id} href={`/article/${article.id}`} legacyBehavior>
                    <a className="block border p-4 mb-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200 rounded-lg">
                      {extractFirstImage(article.content) && (
                        <div className="mb-4">
                          <img src={extractFirstImage(article.content)} alt={article.title} className="w-full h-auto rounded-lg" />
                        </div>
                      )}
                      <div className="flex items-center mb-4">
                        {article.authorProfileImage ? (
                          <img
                            src={article.authorProfileImage}
                            alt="Profile"
                            className="w-8 h-8 rounded-full mr-2"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-500 text-white flex items-center justify-center mr-2">
                            {article.authorName.slice(0, 2)}
                          </div>
                        )}
                        <div className="text-sm text-gray-500">
                          <p className="font-bold">{article.authorName}</p>
                          <p>{calculateReadTime(article.content)} min read • {formatDistanceToNow(new Date(article.createdAt.toDate()))} 전</p>
                        </div>
                      </div>
                      <h2 className="text-xl font-bold mb-2">{article.title}</h2>
                      <p className="mb-4">{extractPreviewText(article.content)}</p>
                      <div className="flex space-x-2">
                        <Link href={`/edit/${article.id}`} legacyBehavior>
                          <a
                            onClick={(e) => e.stopPropagation()}
                            className="bg-green-500 text-white p-2 rounded flex items-center"
                          >
                            <FiEdit />
                          </a>
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleDelete(article.id);
                          }}
                          className="bg-red-500 text-white p-2 rounded flex items-center"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </a>
                  </Link>
                ))}
              </div>
            )}
            {activeTab === 'profile' && (
              <div className="profile">
                {isEditing ? (
                  <>
                    <div className="mb-4">
                      <h3 className="text-xl font-bold">바이오</h3>
                      <textarea
                        name="bio"
                        className="w-full p-2 border rounded"
                        rows="4"
                        placeholder="바이오를 작성하세요..."
                        value={bio}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="mb-4">
                      <h3 className="text-xl font-bold">소셜 미디어 링크</h3>
                      {['instagram', 'threads', 'X', 'youtube'].map((platform) => (
                        <div key={platform} className="mb-2">
                          <label className="block text-sm font-medium mb-1">
                            {platform.charAt(0).toUpperCase() + platform.slice(1)}
                          </label>
                          <input
                            type="text"
                            name={platform}
                            value={socialLinks[platform]}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded"
                            placeholder={`${platform} 링크를 입력하세요`}
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleSaveProfile}
                      className="bg-blue-500 text-white p-2 rounded mr-2"
                    >
                      저장하기
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-500 text-white p-2 rounded"
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <>
                    <div className="mb-4">
                      <h3 className="text-xl font-bold">바이오</h3>
                      <p>{bio || '바이오가 없습니다.'}</p>
                    </div>
                    <div className="mb-4">
                      <h3 className="text-xl font-bold">소셜 미디어 링크</h3>
                      {['instagram', 'threads', 'X', 'youtube'].map((platform) => (
                        <div key={platform} className="mb-2">
                          <label className="block text-sm font-medium mb-1">
                            {platform.charAt(0).toUpperCase() + platform.slice(1)}
                          </label>
                          {socialLinks[platform] ? (
                            <a href={socialLinks[platform]} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                              {socialLinks[platform]}
                            </a>
                          ) : (
                            <p>{`${platform} 링크가 없습니다.`}</p>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-blue-500 text-white p-2 rounded flex items-center"
                    >
                      <FiEdit3 className="mr-1" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <p>You must be logged in to view this page - protected route.</p>
        )}
      </div>
    </div>
  );
};

export default Page;
