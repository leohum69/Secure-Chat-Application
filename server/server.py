from flask import Flask, request, jsonify, session
from flask_pymongo import PyMongo
from werkzeug.security import generate_password_hash, check_password_hash
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from cryptography import x509
from cryptography.hazmat.primitives import hashes
from cryptography.x509.oid import NameOID
import base64
import datetime
import os
from datetime import datetime, timedelta, UTC
from cryptography.hazmat.primitives.asymmetric import dh
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.backends import default_backend
from flask_cors import CORS
import binascii
import re

app = Flask(__name__)
app.secret_key = os.urandom(24)
app.config["MONGO_URI"] = "mongodb://localhost:27017/secure_chat"
mongo = PyMongo(app)
dh_parameters = dh.generate_parameters(generator=2, key_size=2048)

CORS(app, resources={r"/*": {"origins": r".*"}}, supports_credentials=True)


def is_base64(s):
    if isinstance(s, bytes):
        s = s.decode('utf-8', errors='ignore')  # Decode bytes to string safely
    s = s.strip()

    if len(s) % 4 != 0:
        return False

    if not re.match(r'^[A-Za-z0-9+/=]+\Z', s):
        return False

    try:
        decoded = base64.b64decode(s, validate=True)
        encoded = base64.b64encode(decoded).decode('utf-8').strip('=')
        original = s.strip('=')

        return original == encoded
    except (binascii.Error, ValueError):
        return False

def pad_data(data):
    padder = padding.PKCS7(128).padder()  # 128 bit block size for AES
    padded_data = padder.update(data) + padder.finalize()
    return padded_data

# Unpadding after decryption
def unpad_data(data):
    unpadder = padding.PKCS7(128).unpadder()
    unpadded_data = unpadder.update(data) + unpadder.finalize()
    return unpadded_data


# Generate RSA key pair
def generate_rsa_keys():
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048
    )
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption()
    )
    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    return private_key, base64.b64encode(private_pem).decode(), base64.b64encode(public_pem).decode()

def generate_certificate(private_key, username):
    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, "PK"),
        x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "Islamabad"),
        x509.NameAttribute(NameOID.LOCALITY_NAME, "Shamsabad"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "FAST NUCES"),
        x509.NameAttribute(NameOID.COMMON_NAME, username),
    ])
    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(private_key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(datetime.now(UTC))
        .not_valid_after(datetime.now(UTC) + timedelta(days=365))
        .sign(private_key, hashes.SHA256())
    )
    return base64.b64encode(cert.public_bytes(serialization.Encoding.PEM)).decode()

# User Registration
@app.route("/register", methods=["POST"])
def register():
    data = request.json
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return jsonify({"error": "Missing required fields"}), 400

    if mongo.db.users.find_one({"username": username}):
        return jsonify({"error": "Username already exists"}), 400

    password_hash = generate_password_hash(password)
    private_key, private_key_b64, public_key_b64 = generate_rsa_keys()
    certificate_b64 = generate_certificate(private_key, username)

    user_data = {
        "username": username,
        "email": email,
        "password": password_hash,
        "rsa_private_key": private_key_b64,
        "rsa_public_key": public_key_b64,
        "certificate": certificate_b64
    }
    mongo.db.users.insert_one(user_data)
    return jsonify({"message": "User registered successfully"}), 201

# User Login
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    user = mongo.db.users.find_one({"username": username})
    if not user or not check_password_hash(user["password"], password):
        return jsonify({"error": "Invalid credentials"}), 401

    session["user"] = username
    shared_keys = mongo.db.shared_keys.find({"users": {"$in": [username]}})
    
    # Prepare the response with the RSA public key, certificate, and shared keys
    response_data = {
        "message": "Login successful",
        "rsa_public_key": user["rsa_public_key"],
        "certificate": user["certificate"],
        "shared_keys": []
    }

    for shared_key in shared_keys:
        # Extract the AES key and decode it from base64
        aes_key = base64.b64decode(shared_key["aes_key"]).hex()
        # Append the shared key data along with the users involved
        response_data["shared_keys"].append({
            "users": shared_key["users"],
            "aes_key": aes_key
        })

    return jsonify(response_data)


@app.route("/users", methods=["GET"])
def get_users():
    if "user" not in session:
        return jsonify({"error": "Not logged in"}), 401

    current_user = session["user"]
    users = mongo.db.users.find(
        {"username": {"$ne": current_user}}, {"_id": 0, "username": 1}
    )
    return jsonify({"users": list(users)})

@app.route("/start_dh", methods=["POST"])
def start_dh():
    if "user" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    other_user = data.get("to")

    # Generate user's DH key pair
    private_key = dh_parameters.generate_private_key()
    public_key = private_key.public_key()

    # Serialize public key to send over
    public_numbers = public_key.public_numbers()
    dh_public = {
        "y": str(public_numbers.y)
    }

    # Store your DH private key temporarily (for demo, use DB or secure cache)
    mongo.db.dh_keys.update_one(
        {"username": session["user"], "peer": other_user},
        {"$set": {
            "private_numbers": str(private_key.private_numbers().x),
            "peer": other_user
        }},
        upsert=True
    )

    return jsonify({
        "dh_public": dh_public
    })

@app.route("/complete_dh", methods=["POST"])
def complete_dh():
    if "user" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    other_user = data.get("to")
    peer_y = int(data.get("peer_y"))

    record = mongo.db.dh_keys.find_one({"username": session["user"], "peer": other_user})
    if not record:
        return jsonify({"error": "DH not initialized"}), 400

    x = int(record["private_numbers"])

    # Recreate your private key
    private_key = dh.DHPrivateNumbers(
        x=x,
        public_numbers=dh.DHPublicNumbers(
            y=pow(dh_parameters.parameter_numbers().g, x, dh_parameters.parameter_numbers().p), 
            parameter_numbers=dh_parameters.parameter_numbers()
        )
    ).private_key()

    # Recreate peer's public key
    peer_public_numbers = dh.DHPublicNumbers(peer_y, dh_parameters.parameter_numbers())
    peer_public_key = peer_public_numbers.public_key()

    # Compute shared key
    shared_key = private_key.exchange(peer_public_key)

    derived_key = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=None,
        info=b"secure chat"
    ).derive(shared_key)

    mongo.db.shared_keys.update_one(
        {"users": sorted([session["user"], other_user])},
        {"$set": {"aes_key": base64.b64encode(derived_key).decode()}},
        upsert=True
    )

    mongo.db.messages.delete_many({
        "$or": [
            {"from": session["user"], "to": other_user},
            {"from": other_user, "to": session["user"]}
        ]
    })
    

    return jsonify({"message": "Shared key established!"})

def encrypt_message(key, plaintext):
    iv = os.urandom(16)
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    encryptor = cipher.encryptor()
    padded_plaintext = pad_data(plaintext.encode())
    ciphertext = encryptor.update(padded_plaintext) + encryptor.finalize()
    return iv + ciphertext  # IV is prepended to the ciphertext

def decrypt_message(key, ciphertext):
    iv = ciphertext[:16]
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    decryptor = cipher.decryptor()
    padded_data = decryptor.update(ciphertext[16:]) + decryptor.finalize()
    return unpad_data(padded_data).decode('utf-8')


@app.route("/send_message", methods=["POST"])
def send_message():
    data = request.json
    sender = session.get("user")
    recipient = data.get("to")
    plaintext = data.get("message")

    if not sender or not recipient or not plaintext:
        return jsonify({"error": "Missing data"}), 400

    record = mongo.db.shared_keys.find_one({
        "users": sorted([sender, recipient])
    })

    if not record:
        return jsonify({"error": "Shared key not found"}), 400
    
    shared_key_b64 = record.get("aes_key")
    shared_key = base64.b64decode(shared_key_b64)

    encrypted = encrypt_message(shared_key, plaintext)

    mongo.db.messages.insert_one({
        "from": sender,
        "to": recipient,
        "message": encrypted,
        "timestamp": datetime.utcnow()
    })

    return jsonify({"message": "Message sent"})

@app.route("/get_messages", methods=["GET"])
def get_messages():
    sender = session.get("user")
    recipient = request.args.get("with")

    if not sender or not recipient:
        return jsonify({"error": "Missing parameters"}), 400

    record = mongo.db.shared_keys.find_one({
        "users": sorted([sender, recipient])
    })

    if not record:
        return jsonify({"error": "Shared key not found"}), 400

    shared_key_b64 = record.get("aes_key")
    shared_key = base64.b64decode(shared_key_b64)

    messages = mongo.db.messages.find({
        "$or": [
            {"from": sender, "to": recipient},
            {"from": recipient, "to": sender}
        ]
    }).sort("timestamp", 1)

    decrypted_messages = []
    for msg in messages:
        if not is_base64(msg["message"]):
            decrypted = decrypt_message(shared_key, msg["message"])
        else:    
            decrypted = decrypt_message(shared_key, base64.b64decode(msg["message"]))
        decrypted_messages.append({
            "from": msg["from"],
            "to": msg["to"],
            "message": decrypted,
            "timestamp": msg["timestamp"].isoformat()
        })

    return jsonify(decrypted_messages)



if __name__ == "__main__":
    app.run(debug=True)
