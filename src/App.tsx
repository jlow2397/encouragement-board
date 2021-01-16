// import logo from './logo.svg';
import './App.css';
import React, { useRef, useState } from 'react';

import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import firebaseConfig from './firebaseConfig';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();
const db = firebase.firestore();


function App() {

  const [user] = useAuthState(auth);

  const usersRef = db.collection('users');
  const [users] = useCollectionData(usersRef);

  return (
    <div className="App">
      <div>HSF Encouragement Board</div>
      {
        user
          ? (
            <div>
              <p>Hello, {user.displayName}</p>
              <SignOut />
            </div>
          )
          : (
            <div>
              <p>Please sign in.</p>
              <SignIn />
            </div>
          )
      }
      {users ?
        <ul>
          {users.map((u: any, i: number) => (
            <li key={i}>
              Hello {u.name}
            </li>
          ))}
        </ul>
        : <div>Hello World</div>
      }
    </div>
  );
}

function SignIn() {

  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .then(async (result) => {
        if (result.user != null) {
          const u = await db.collection('users')
            .where("email", "==", result.user.email)
            .get();
          // console.log(u.docs);
          // make a new user if there is no user existing
          if (u.empty) {
            db.collection('users').add({
              name: result.user.displayName,
              email: result.user.email,
              notesReceived: 0,
              notesWritten: 0
            })
            .then(() => {
              console.log('New user added!');
            });
          }
        }
      });
  }

  return (
    <>
      <button className="sign-in" onClick={signInWithGoogle}>Sign in with Google</button>
    </>
  )

}

function SignOut() {
  return auth.currentUser && (
    <button className="sign-out" onClick={() => auth.signOut()}>Sign Out</button>
  )
}



export default App;
