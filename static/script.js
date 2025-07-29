const socket = io();
const peer = new Peer();

let myVideo = document.createElement('video');
myVideo.muted = true;
let localStream;

const lawyerVideo = document.getElementById('lawyerVideo');
const clientVideo = document.getElementById('clientVideo');
const messages = document.getElementById('messages');

// Get media
navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
    localStream = stream;

    // Set own video
    if (user === "lawyer") {
        lawyerVideo.srcObject = stream;
    } else {
        clientVideo.srcObject = stream;
    }

    peer.on('call', call => {
        call.answer(stream);
        call.on('stream', remoteStream => {
            if (user === "lawyer") {
                clientVideo.srcObject = remoteStream;
            } else {
                lawyerVideo.srcObject = remoteStream;
            }
        });
    });

    socket.emit('join-room', { room, user });

    socket.on('user-joined', data => {
        if (data.user !== user) {
            const call = peer.call(peer.id, stream);
            call.on('stream', remoteStream => {
                if (user === "lawyer") {
                    clientVideo.srcObject = remoteStream;
                } else {
                    lawyerVideo.srcObject = remoteStream;
                }
            });
        }
    });
});

document.getElementById('chatForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = document.getElementById('chatInput').value;
    socket.emit('chat-message', { room, msg, sender: user });
    addMessage(`${user}: ${msg}`, user);
    document.getElementById('chatInput').value = '';
});

socket.on('chat-message', (data) => {
    if (data.sender !== user) {
        addMessage(`${data.sender}: ${data.msg}`, data.sender);
    }
});

function addMessage(msg, sender) {
    const msgElem = document.createElement('div');
    msgElem.style.textAlign = sender === user ? 'right' : 'left';
    msgElem.style.margin = '5px 0';
    msgElem.textContent = msg;
    messages.appendChild(msgElem);
    messages.scrollTop = messages.scrollHeight;
}

function leaveRoom() {
    socket.emit('leave-room', { room, user });
    window.location.href = '/';
}
