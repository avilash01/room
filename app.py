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
        if room not in rooms:
            rooms[room] = []
        if len(rooms[room]) >= 2:
            return "Room full!"
        return redirect(url_for('room', room_name=room, user_type=user_type))
    return render_template('index.html')

@app.route('/room/<room_name>/<user_type>')
def room(room_name, user_type):
    return render_template('room.html', room_name=room_name, user_type=user_type)

@socketio.on('join-room')
def handle_join(data):
    room = data['room']
    user = data['user']
    if room not in rooms:
        rooms[room] = []
    if len(rooms[room]) >= 2:
        emit('room-full')
    else:
        join_room(room)
        rooms[room].append(user)
        emit('user-joined', {'user': user}, to=room)

@socketio.on('leave-room')
def handle_leave(data):
    room = data['room']
    user = data['user']
    leave_room(room)
    if user in rooms.get(room, []):
        rooms[room].remove(user)
    emit('user-left', {'user': user}, to=room)

if __name__ == '__main__':
    socketio.run(app, debug=True)
