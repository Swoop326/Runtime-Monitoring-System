import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sklearn.model_selection import train_test_split

# Load dataset
data = pd.read_csv("runtime_dataset.csv")

X = data.drop("label", axis=1)
y = data["label"]

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42
)

# Train Isolation Forest
model = IsolationForest(contamination=0.3, random_state=42)
model.fit(X_train)

# Predictions
pred = model.predict(X_test)

# Convert predictions
pred = [1 if p == -1 else 0 for p in pred]

# Metrics
print("Accuracy:", accuracy_score(y_test, pred))
print("Precision:", precision_score(y_test, pred))
print("Recall:", recall_score(y_test, pred))
print("F1 Score:", f1_score(y_test, pred))
print("Confusion Matrix:\n", confusion_matrix(y_test, pred))