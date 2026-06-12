const PORT = process.env.PORT || 5000; // Render сам передаст нужный порт в process.env.PORT
app.listen(PORT, () => console.log(`Server runs on port ${PORT}`));