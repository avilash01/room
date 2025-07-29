const socket = io();
const peer = new Peer();

let localStream;
const peers = {};

const messages = document.getElementById('messages');
const videoContainer = document.querySelector('.video-container');

navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
    localStream = stream;
    addVideoStream(createVideoElement(user), stream);

    peer.on('call', call => {
        call.answer(stream);
        const video = createVideoElement("Peer");
        call.on('stream', remoteStream => {
            addVideoStream(video, remoteStream);
        });
    });

    socket.emit('join-room', { room, user, peerId: peer.id });

    socket.on('user-connected', ({ peerId }) => {
        connectToNewUser(peerId, stream);
    });
});

function connectToNewUser(peerId, stream) {
    const call = peer.call(peerId, stream);
    const video = createVideoElement("Peer");
    call.on('stream', remoteStream => {
        addVideoStream(video, remoteStream);
    });
    call.on('close', () => {
        video.remove();
    });
    peers[peerId] = call;
}

function createVideoElement(label) {
    const wrapper = document.createElement('div');
    wrapper.className = 'video-box';

    const title = document.createElement('h2');
    title.innerText = label;

    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;

    wrapper.appendChild(title);
    wrapper.appendChild(video);
    videoContainer.appendChild(wrapper);
    return video;
}

function addVideoStream(video, stream) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => video.play());
}

// Chat
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

// Screen Share
function startScreenShare() {
    navigator.mediaDevices.getDisplayMedia({ video: true }).then(screenStream => {
        for (let peerId in peers) {
            const sender = peers[peerId].peerConnection.getSenders().find(s => s.track.kind === 'video');
            if (sender) sender.replaceTrack(screenStream.getVideoTracks()[0]);
        }

        screenStream.getVideoTracks()[0].onended = () => {
            for (let peerId in peers) {
                const sender = peers[peerId].peerConnection.getSenders().find(s => s.track.kind === 'video');
                if (sender) sender.replaceTrack(localStream.getVideoTracks()[0]);
            }
        };
    });
}
