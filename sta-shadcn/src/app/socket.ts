import { io } from "socket.io-client";

export const socket = io("http://192.168.32.89:3001", {
    autoConnect: true
})

