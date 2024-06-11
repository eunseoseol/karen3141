import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { UserAuth } from '../context/AuthContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './../firebase'; // Firestore instance
import { BellIcon, PencilAltIcon } from '@heroicons/react/outline'; // Heroicons, install if needed: npm install @heroicons/react

const Navbar = () => {
  const { user, googleSignIn, logOut } = UserAuth();
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false); // Menu box display state
  const [notifications, setNotifications] = useState([]);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false); // Notification menu box display state
  const notificationRef = useRef(null);

  const handleSignIn = async () => {
    try {
      await googleSignIn();
    } catch (error) {
      console.log(error);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      setMenuOpen(false); // Close menu on logout
    } catch (error) {
      console.log(error);
    }
  };

  const handleProfileView = () => {
    setMenuOpen(false); // Close menu on profile view click
  };

  const fetchNotifications = async () => {
    if (user) {
      const q = query(collection(db, 'notifications'), where('recipient', '==', user.email));
      const querySnapshot = await getDocs(q);
      const notificationsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(notificationsData);
    }
  };

  useEffect(() => {
    const checkAuthentication = async () => {
      if (user) {
        // Fetch user profile image from Firestore
        const userDocRef = doc(db, 'users', user.email);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.profileImage) {
            setProfileImage(userData.profileImage);
          }
        }
 
        await fetchNotifications();
      }
      setLoading(false);
    };
    checkAuthentication();
  }, [user]);

  useEffect(() => {
    // Close notification menu box on outside click
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="content-container">
      <div className="h-20 w-full border-b-2 flex items-center justify-between p-2 relative">
        <ul className="flex">
          <li className="p-2 cursor-pointer">
            <Link href="/">
              <span className="text-xl lg:text-1.5xl font-semibold text-black-600">
                암호화폐 커뮤니티
              </span>
            </Link>
          </li>
        </ul>
        {loading ? null : !user ? (
          <ul className="flex">
            <li onClick={handleSignIn} className="p-2 cursor-pointer">
              로그인하기
            </li>
          </ul>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center' }} className="relative space-x-4">
            <div className="relative p-2 cursor-pointer flex items-center bg-gray-100 rounded-full hover:bg-gray-200 sm:h-10 sm:w-auto sm:px-4 sm:py-2 h-10 w-10 justify-center">
              <Link href="/about" className="flex items-center sm:px-4 sm:py-2">
                <PencilAltIcon className="w-5 h-5 sm:mr-1" />
                <span className="hidden sm:inline">글쓰기</span>
              </Link>
            </div>
            <div className="relative p-2 cursor-pointer bg-gray-100 rounded-full hover:bg-gray-200 h-10 w-10 flex items-center justify-center" ref={notificationRef}>
              <div onClick={() => setNotificationMenuOpen(!notificationMenuOpen)}>
                <BellIcon className="w-6 h-6" />
              </div>
              {notificationMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-300 rounded shadow-lg z-10">
                  <div className="p-2 text-sm font-bold border-b">알림</div>
                  {notifications.length > 0 ? (
                    notifications.map(notification => (
                      <div key={notification.id} className="p-2 border-b text-sm">
                        <p className="text-gray-700">{notification.message}</p>
                        <p className="text-xs text-gray-500">{new Date(notification.timestamp.toDate()).toLocaleString()}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-gray-500">알림이 없습니다.</div>
                  )}
                </div>
              )}
            </div>
            <div className="relative cursor-pointer" onClick={() => setMenuOpen(!menuOpen)}>
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-500 text-white flex items-center justify-center">
                  {user.displayName ? user.displayName.slice(0, 2) : 'U'}
                </div>
              )}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded shadow-lg">
                  <Link href="/profile" legacyBehavior>
                    <a
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={handleProfileView}
                    >
                      프로필 보기
                    </a>
                  </Link>
                  <div
                    onClick={handleSignOut}
                    className="block px-4 py-2 text-gray-700 cursor-pointer hover:bg-gray-100"
                  >
                    로그아웃
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
