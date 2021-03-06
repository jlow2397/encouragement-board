import './NewMessage.css';
import './Messages.css';
import React, { useRef, useState, useEffect } from 'react';
import { useDocumentData, useCollectionData } from 'react-firebase-hooks/firestore';

import { CircularProgress } from '@material-ui/core';

import firebase from 'firebase/app';
const db = firebase.firestore();

export interface MessageType {
  text: any;
  id: string;
  displayName: string;
  uid: string;
  class: string;
  photoURL: string;
  createdAt: Date;
}

function NewMessage (props: any) {

  const [formValue, setFormValue] = useState('');
  const [formStyle, setFormStyle] = useState('text');
  const [formClass, setFormClass] = useState('text');
  const suRef = db.collection('users').doc(props.selectedUser);
  const messagesRef = suRef.collection('messages');
  const [selected, loading] = useDocumentData<any>(suRef);
  const [msgs, msgLoading] = useCollectionData(messagesRef);
  const [sentMsg, setSentMsg] = useState<MessageType>();

  const sendMessage = async (e: any) => {
    e.preventDefault();

    const { uid, photoURL, displayName } = props.user;
    const text = {
      message: formValue,
      style: formStyle
    };

    let msg;

    if (sentMsg) {
      // if a message already exists, then add more text
      await messagesRef.doc(sentMsg.id).update({
        text: firebase.firestore.FieldValue.arrayUnion(text),
        class: formClass
      });

      msg = await messagesRef.doc(sentMsg.id).get();
    }
    else {
      // if a message does not exist, create the message
      await messagesRef.add({
        text: [text],
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        class: formClass,
        uid,
        displayName,
        photoURL
      }).then(async (newDoc) => {
        // add the message id to the message
        messagesRef.doc(newDoc.id).update({
          id: newDoc.id,
        });
        // increment notes received from the selected user
        suRef.update({
          notesReceived: firebase.firestore.FieldValue.increment(1),
        });
        // increment notes sent from the sending user
        db.collection('users').doc(uid).update({
          notesWritten: firebase.firestore.FieldValue.increment(1),
        });

        msg = await messagesRef.doc(newDoc.id).get();
      });
    }
    if (msg) {
      checkMessage(msg.data());
    }
    setFormValue('');
  }

  const deleteMessage = async ( message:any ) => {
    if (sentMsg) {
      await messagesRef.doc(sentMsg.id).update({
        text: firebase.firestore.FieldValue.arrayRemove(message),
      });

      const msg = await messagesRef.doc(sentMsg.id).get();
      checkMessage(msg.data());
    }
  }

  const checkMessage = (msg: any) => {

    const m = msg;
    // console.log('checking message!');

    const setMsg = {
      uid : m?.uid,
      id: m?.id,
      photoURL: m?.photoURL,
      createdAt: m?.createdAt,
      text: m?.text,
      class: m?.class,
      displayName: m?.displayName,
    };
    setSentMsg(setMsg);
    setFormClass(setMsg.class);

    // console.log(setMsg.class);
  }

  const PastMessages = () => {
    if (sentMsg) {
      return (
        <div>
          {sentMsg.text.map((m:any, i:number) => (
            <div className="past-messages__text-row">
              <button className="delete x" onClick={() => deleteMessage(m)}>x</button>
              <p key={i} className={m.style}>{m.message}</p>
            </div>
          ))}
        </div>
      );
    } else {
      return null;
    }
  }

  useEffect(() => {
    // check to see if a message has already been sent
    if (msgs && msgs.length != 0) {
      msgs.map((msg:any) => {
        if (msg.uid == props.user.uid) {
          setSentMsg(msg);
          setFormClass(msg?.class);
        }
      });
    }
    //console.log('use 3 effect');
  }, [msgLoading, sentMsg]);

  return (
    (!loading && !msgLoading) ?
      <div className={`new-message ${formClass}`}>
        <h3>Your message to <em>{selected.name}</em></h3>
        <PastMessages />

        <form onSubmit={sendMessage}>
          <button className="close x" onClick={props.hideMessages}>x</button>
          <textarea className={formStyle} value={formValue}
            onChange={(e) => {
              setFormValue(e.target.value)}}
            placeholder="say something nice" />
          <div className="button-row">
            <label htmlFor="form-style">Text Style</label>
            <select id="form-style" value={formStyle}
              onChange={(e) => {
                setFormStyle(e.target.value)}}>
              <option value="text">Normal</option>
              <option value="bold">Bold</option>
              <option value="italic">Italic</option>
              <option value="van">Vanessa Loud</option>
            </select>
            <label htmlFor="form-class">Letter Style</label>
            <select id="form-class" value={formClass}
              onChange={(e) => {
                setFormClass(e.target.value)}}>
              <option value="">Normal</option>
              <option value="blue">Blue</option>
              <option value="logo">Logo</option>
              <option value="white">Sparkle</option>
            </select>
            <button className="submit" type="submit" disabled={!formValue}>Send it!</button>
          </div>
        </form>
      </div>
    : <div><CircularProgress /></div>
  );
}

export default NewMessage;
