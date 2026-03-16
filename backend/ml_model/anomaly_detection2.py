import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns
import matplotlib.pyplot as plt

data = pd.read_csv("license_validation_dataset.csv")
print("Dataset Loaded Successfully")
print(f"Total Records: {len(data)}")
print(f"\nColumn Names:\n{list(data.columns)}")
print(f"\nFirst 5 Rows:\n{data.head()}")

features = [
    "session_duration_minutes",
    "active_sessions",
    "unique_devices_used",
    "login_frequency_per_day",
    "geo_location_change",
    "vpn_detected",
    "rule_violation_flag",
    "anomaly_score",
    "trust_score"
]

numeric_data = data[features]
print(f"\nFeatures Used for Training:\n{features}")


model = IsolationForest(contamination=0.1, random_state=42)
model.fit(numeric_data)
print("\nIsolation Forest Model Trained Successfully")


data['predicted_label'] = model.predict(numeric_data)


data['predicted_label'] = data['predicted_label'].map({-1: 1, 1: 0})

print(f"\nPrediction Distribution:")
print(data['predicted_label'].value_counts().rename({0: 'Normal', 1: 'Anomaly'}))



print("\n--- Classification Report ---")
print(classification_report(
    data['anomaly_label'],
    data['predicted_label'],
    target_names=['Normal', 'Anomaly']
))

print("Confusion Matrix:")
cm = confusion_matrix(data['anomaly_label'], data['predicted_label'])
print(cm)



def enforce_policy(trust_score):
    if trust_score >= 0.75:
        return "Allow"
    elif trust_score >= 0.5:
        return "Warn"
    elif trust_score >= 0.3:
        return "Restrict"
    else:
        return "Suspend"

data['enforced_action'] = data['trust_score'].apply(enforce_policy)

print("\n--- Policy Enforcement Sample (10 Records) ---")
print(data[['user_id', 'trust_score', 'anomaly_score', 'predicted_label', 'enforced_action']].head(10).to_string(index=False))


print("\n--- Single Prediction Test ---")
new_data = [[400, 5, 5, 20, 1, 1, 1, 0.85, 0.2]]
prediction = model.predict(new_data)

if prediction[0] == -1:
    print("Result: ANOMALY DETECTED — Suspicious license usage identified")
else:
    print("Result: Normal Behaviour")



plt.figure(figsize=(8, 5))
sns.scatterplot(
    data=data,
    x="anomaly_score",
    y="trust_score",
    hue="action_taken",
    palette={"Allow": "green", "Warn": "orange", "Restrict": "red", "Suspend": "darkred"}
)
plt.title("Anomaly Score vs Trust Score (by Action Taken)")
plt.xlabel("Anomaly Score")
plt.ylabel("Trust Score")
plt.legend(title="Action Taken")
plt.tight_layout()
plt.show()


plt.figure(figsize=(6, 4))
sns.heatmap(
    cm,
    annot=True,
    fmt='d',
    cmap='Blues',
    xticklabels=['Normal', 'Anomaly'],
    yticklabels=['Normal', 'Anomaly']
)
plt.title("Confusion Matrix — Isolation Forest")
plt.xlabel("Predicted Label")
plt.ylabel("Actual Label")
plt.tight_layout()
plt.show()


plt.figure(figsize=(6, 4))
action_counts = data['enforced_action'].value_counts()
action_counts.plot(
    kind='bar',
    color=['green', 'orange', 'red', 'darkred']
)
plt.title("Policy Enforcement Actions Distribution")
plt.xlabel("Action")
plt.ylabel("Number of Users")
plt.xticks(rotation=0)
plt.tight_layout()
plt.show()


plt.figure(figsize=(8, 4))
sns.histplot(data=data, x="trust_score", hue="predicted_label",
             bins=30, palette={0: "steelblue", 1: "tomato"}, kde=True)
plt.title("Trust Score Distribution — Normal vs Anomaly")
plt.xlabel("Trust Score")
plt.ylabel("Count")
handles, _ = plt.gca().get_legend_handles_labels()
plt.legend(handles, ['Normal', 'Anomaly'], title='Predicted Label')
plt.tight_layout()
plt.show()


plt.figure(figsize=(7, 5))
sns.scatterplot(
    data=data,
    x="active_sessions",
    y="unique_devices_used",
    hue="predicted_label",
    palette={0: "steelblue", 1: "tomato"},
    alpha=0.6
)
plt.title("Active Sessions vs Unique Devices Used")
plt.xlabel("Active Sessions")
plt.ylabel("Unique Devices Used")
handles, _ = plt.gca().get_legend_handles_labels()
plt.legend(handles, ['Normal', 'Anomaly'], title='Predicted Label')
plt.tight_layout()
plt.show()

print("\n All steps completed successfully.")
print("Plots displayed. Model is ready for integration into the full system.")