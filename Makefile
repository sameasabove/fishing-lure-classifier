.PHONY: setup dev-backend dev-frontend

# Run once after cloning to link your local environment to Doppler
setup:
	doppler setup --project my-tackle-box --config dev_my-tackle-box

# Start the Flask backend with secrets injected by Doppler
dev-backend:
	cd backend && doppler run -- python app.py

# Start the Expo dev server with secrets injected by Doppler
dev-frontend:
	cd frontend && doppler run -- npx expo start
