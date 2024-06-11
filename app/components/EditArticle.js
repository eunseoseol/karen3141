"use client";
import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "./../../firebase";
import Spinner from "./../../components/Spinner";

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const EditArticle = () => {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const quillRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchArticle = async () => {
      const docRef = doc(db, "KarenArticles", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const article = docSnap.data();
        setTitle(article.title);
        setContent(article.content);
      } else {
        console.log("No such document!");
      }
      setLoading(false);
    };

    fetchArticle();
  }, [id]);

  useEffect(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      quill.getModule('toolbar').addHandler('image', () => {
        imageHandler(quill);
      });

      quill.root.addEventListener('click', (e) => {
        if (e.target && e.target.tagName === 'IMG') {
          if (selectedImage) {
            selectedImage.classList.remove('selected-image');
          }
          e.target.classList.add('selected-image');
          setSelectedImage(e.target);
        } else if (selectedImage) {
          selectedImage.classList.remove('selected-image');
          setSelectedImage(null);
        }
      });

      document.addEventListener('keydown', (e) => {
        if (selectedImage && e.key === 'Escape') {
          selectedImage.classList.remove('selected-image');
          setSelectedImage(null);
        } else if (selectedImage && e.key === 'Delete') {
          quill.deleteText(quill.getSelection(), 1);
          setSelectedImage(null);
        }
      });
    }
  }, [selectedImage]);

  const imageHandler = (quill) => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.setAttribute('multiple', true);
    input.click();

    input.onchange = async () => {
      const files = input.files;
      if (files.length > 4) {
        alert('You can only upload up to 4 images.');
        return;
      }

      const uploadPromises = [];
      for (const file of files) {
        const storageRef = ref(storage, `images/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        const uploadPromise = new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            snapshot => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log('Upload is ' + progress + '% done');
            },
            error => {
              console.error(error);
              reject(error);
            },
            () => {
              getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                resolve(downloadURL);
              });
            }
          );
        });

        uploadPromises.push(uploadPromise);
      }

      const downloadURLs = await Promise.all(uploadPromises);
      const range = quill.getSelection();
      let currentIndex = range ? range.index : 0;
      downloadURLs.forEach(url => {
        quill.insertEmbed(currentIndex, 'image', url, 'user');
        quill.setSelection(currentIndex + 1);
        quill.insertText(currentIndex + 1, '\n');
        currentIndex += 2;  // 이미지와 줄 바꿈 후 커서를 다음 위치로 이동
      });

      // Add border radius to the images
      quill.root.querySelectorAll('img').forEach(img => {
        img.style.borderRadius = '16px';
      });
    };
  };

  const handleUpdate = async () => {
    setLoading(true);
    const docRef = doc(db, "KarenArticles", id);
    await updateDoc(docRef, {
      title: title,
      content: content,
      updatedAt: new Date()
    });
    setLoading(false);
    router.push('/');
  };

  if (loading) return <Spinner />;

  const modules = {
    toolbar: {
      container: [
        [{ 'header': '1'}, {'header': '2'}, { 'font': [] }],
        [{ size: [] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
        ['link', 'image'],
        [{ 'align': [] }],
        ['clean']
      ]
    }
  };

  return (
    <div className="content-container">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Edit Article</h1>
          <button
            type="button"
            className="bg-blue-500 text-white p-2 rounded"
            onClick={handleUpdate}
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update'}
          </button>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            type="text"
            className="border rounded w-full p-2"
            placeholder="Enter the title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Content</label>
          <div style={{ height: '800px' }}>
            <ReactQuill
              ref={quillRef}
              value={content}
              onChange={setContent}
              modules={modules}
              className="border rounded"
              style={{ height: '100%', maxHeight: '100%' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditArticle;
