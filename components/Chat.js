import React from "react";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  Button,
  TouchableOpacity,
} from "react-native";

import { GiftedChat, Bubble, InputToolbar } from "react-native-gifted-chat";
import MapView from "react-native-maps";
import firebase from "firebase"; //import firebase to fetch the data from firebase Database is giving me an error I Can't solve
import AsyncStorage from "@react-native-community/async-storage";

import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

import CustomActions from "./CustomActions";

export default class Chat extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: [],
      user: {
        _id: 1,
        name: "Manpreet",
        avatar: "https://placeimg.com/140/140/any",
      },
      uid: 0,
      loggedInText: "Please wait, you are getting logged in",
      isConnected: false,
      image: null,
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

    NetInfo.fetch().then((connection) => {
      if (connection.isConnected) {
        this.setState({ isConnected: true });

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
  } else {
        this.setState({
          isConnected: false,
          loggedInText: "No Internet Connection Detected",
        });
        this.getMessages();
      }
    });
  }


  componentWillUnmount() {
      if (this.state.isConnected) {
        // stop listening to authentication
        this.authUnsubscribe();
        // stop listening for changes
        this.unsubscribe();
      }
    }


    onCollectionUpdate = (querySnapshot) => {
     const messages = [];
     // go through each document
     querySnapshot.forEach((doc) => {
       // get the QueryDocumentSnapshot's data
       let data = doc.data();
       messages.push({
         _id: data._id,
         text: data.text || "",
         createdAt: data.createdAt.toDate(),
         user: data.user,
         image: data.image || null,
         location: data.location || null,
       });
     });
     this.setState({
       messages,
     });
     let text = messages[0].text;
     if (text.includes("hi")) {
       this.onSend({
         user: {
           _id: 0,
         },
         text: "where are you?",
       });
     }
   };


   sendMessage(messages) {
      const message = this.state.messages[0];
      this.referenceChatMessages.add({
        _id: message._id,
        text: message.text || "",
        createdAt: message.createdAt,
        user: message.user,
        image: message.image || null,
        location: message.location || null,
      }); // on send add the message[0] to the firebase then it automaticaly will be fetched
    }

    onSend(messages = []) {
        this.setState(
          (previousState) => ({
            messages: GiftedChat.append(previousState.messages, messages),
          }),
          () => {
            //save messages in firebase
            this.sendMessage(messages);
            //save message in local storage
            this.saveMessages(messages);
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
     // disables message input bar if offline
     renderInputToolbar = (props) => {
       if (this.state.isConnected === false) {
       } else {
         return <InputToolbar {...props} />;
       }
     };

     //
     renderCustomActions = (props) => {
       return <CustomActions {...props} />;
     };

     //custom map view
     renderMapView(props) {
       const { currentMessage } = props;
       if (currentMessage.location) {
         return (
           <MapView
             style={{ width: 150, height: 100, borderRadius: 13, margin: 3 }}
             region={{
               latitude: currentMessage.location.latitude,
               longitude: currentMessage.location.longitude,
               latitudeDelta: 0.0922,
               longitudeDelta: 0.0421,
             }}
           />
         );
       }
       return null;
     }

     render() {
       let chatColor = this.props.route.params.color;

       return (
         <KeyboardAvoidingView
           behavior={Platform.OS === "ios" ? null : null}
           style={{ flex: 1, justifyContent: "flex-end" }}
         >
           <Text>{this.state.loggedInText}</Text>
           {/* <TouchableOpacity onPress={() => this.deleteMessages()}>
             <Text>delete</Text>
           </TouchableOpacity> */}

           <GiftedChat
             // listVieProps allows me to change the color background of the GiftedChat
             listViewProps={{
               style: {
                 backgroundColor: chatColor,
               },
             }}
             renderBubble={this.renderBubble.bind(this)} //changes the color of the chat bubble
             //render inputbar if user is online
             renderInputToolbar={this.renderInputToolbar}
             messages={this.state.messages}
             onSend={(messages) => this.onSend(messages)}
             renderCustomView={this.renderMapView}
             user={this.state.user}
             renderActions={this.renderCustomActions}
           />
         </KeyboardAvoidingView> // If I add a view in as a parent of the GiftedChat, this last does not render
       );
     }
   }
