from flask import Flask, render_template, request, redirect, url_for
from flask_socketio import SocketIO, join_room, leave_room, emit

app = Flask(__name__)
socketio = SocketIO(app)
rooms = {}

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        room = request.form['room']
        user_type = request.form['user_type']
        return redirect(url_for('room', room_name=room, user_type=user_type))
    return render_template('index.html')

@app.route('/room/<room_name>/<user_type>')
def room(room_name, user_type):
    return render_template('room.html', room_name=room_name, user_type=user_type)

@socketio.on('join-room')
def handle_join(data):
    room = data['room']
    user = data['user']
    peer_id = data['peerId']

    if room not in rooms:
        rooms[room] = []
    join_room(room)
    rooms[room].append({'user': user, 'peerId': peer_id})

    emit('user-connected', {'peerId': peer_id}, room=room, include_self=False)

@socketio.on('leave-room')
def handle_leave(data):
    room = data['room']
    user = data['user']
    leave_room(room)
    if room in rooms:
        rooms[room] = [u for u in rooms[room] if u['user'] != user]
        emit('user-left', {'user': user}, to=room)

if __name__ == '__main__':
    socketio.run(app, debug=True)
