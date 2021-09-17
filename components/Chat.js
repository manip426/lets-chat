import React from "react";
import { KeyboardAvoidingView, Platform, Text, Button } from "react-native";

import { GiftedChat, Bubble } from "react-native-gifted-chat";
import firebase from "firebase"; //import firebase to fetch the data from firebase Database is giving me an error I Can't solve
import AsyncStorage from "@react-native-community/async-storage";

import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

export default class Chat extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: [],
      user: {
        _id: "",
        name: "",
        avatar: "",
      },
      uid: 0,
      loggedInText: "Please wait, you are getting logged in",
    };
    if (!firebase.apps.length) {
      // firebase credentials
      firebase.initializeApp({
        apiKey: "AIzaSyDSgFiVJ2933nxF9SBotfer6C_wsvC68uo",
        authDomain: "lets-chat-1657c.firebaseapp.com",
        projectId: "lets-chat-1657c",
        storageBucket: "lets-chat-1657c.appspot.com",
        messagingSenderId: "917168535481",
        appId: "1:917168535481:web:5096ef425ea8385a99e868",
        measurementId: "G-F53M525R80",
      });
    }

    this.referenceChatMessagesUser = null;
  }

  // AsyncStorage code
   //this function get messages locally stored using getItem asynchronously
   async getMessages() {
     let messages = "";
     try {
       messages = (await AsyncStorage.getItem("messages")) || [];
       this.setState({
         messages: JSON.parse(messages),
       });
     } catch (error) {
       console.log(error.message);
     }
   }

   //this function save messages locally using setItem asynchronously
   async saveMessages() {
     try {
       await AsyncStorage.setItem(
         "messages",
         JSON.stringify(this.state.messages)
       );
     } catch (error) {
       console.log(error.message);
     }
   }

   //this function delete messages locally using removeItem asynchronously
   async deleteMessages() {
     try {
       await AsyncStorage.removeItem("messages");
       this.setState({
         messages: [],
       });
     } catch (error) {
       console.log(error.message);
     }
   }


  componentDidMount() {
    let name = this.props.route.params.name;

    this.props.navigation.setOptions({ title: "Hi " + name });

    //creating a references to messages collection- brings the data from the collection "messages", this.referenceChatMessages will receive the data and database updates
    this.referenceChatMessages = firebase.firestore().collection("messages");

    // listen to authentication events
    this.authUnsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
      if (!user) {
        await firebase.auth().signInAnonymously();
      }
      //update user state with currently active user data
      this.setState({
        uid: user.uid,
        loggedInText: "Hello there",
      });

      // create a reference to the active user's documents (shopping lists)
      this.referenceChatMessagesUser = firebase
        .firestore()
        .collection("messages")
        .where("uid", "==", this.state.uid);
      // listen for collection changes for current user

      this.unsubscribe = this.referenceChatMessages
        //orderBy sort the documents (messages) by date
        .orderBy("createdAt", "desc")
        .onSnapshot(this.onCollectionUpdate);
    });
  }

  componentWillUnmount() {
    // stop listening to authentication
    this.authUnsubscribe();
    // stop listening for changes
    this.unsubscribe();
  }

  onCollectionUpdate = (querySnapshot) => {
    const messages = [];
    // go through each document
    querySnapshot.forEach((doc) => {
      // get the QueryDocumentSnapshot's data
      let data = doc.data();
      messages.push({
        _id: data._id,
        text: data.text,
        user: data.user,
        system: data.system,
        createdAt: data.createdAt.toDate(),
      });
    });
    this.setState({
      messages,
    });
  };

  sendMessage(messages) {
    this.referenceChatMessages.add(messages[0]); // on send add the message[0] to the firebase then it automaticaly will be fetched
  }
  onSend(messages = []) {
    this.setState(
      (previousState) => ({
        messages: GiftedChat.append(previousState.messages, messages),
      }),
      () => {
        this.sendMessage(messages);
      }
    );
  }


    renderBubble(props) {
      return (
        <Bubble
          {...props}
          wrapperStyle={{
            right: {
              backgroundColor: "#000",
            },
          }}
        />
      );
    }
  render() {
     let chatColor = this.props.route.params.color;

     return (
       <KeyboardAvoidingView
         behavior={Platform.OS === "ios" ? null : null}
         style={{ flex: 1, justifyContent: "flex-end" }}
       >
         <Text>{this.state.loggedInText}</Text>
         <GiftedChat
           listViewProps={{
             style: {
               backgroundColor: chatColor,
             },
           }} // listVieProps allows me to change the color background of the GiftedChat
           renderBubble={this.renderBubble.bind(this)} //changes the color of the chat bubble
           messages={this.state.messages}
           onSend={(messages) => this.onSend(messages)}
           user={{
             _id: 1,
             name: "pedro",
             avatar: "https://placeimg.com/140/140/any",
           }}
         />
       </KeyboardAvoidingView> // If I add a view in as a parent of the GiftedChat, this last does not render
     );
   }
 }
