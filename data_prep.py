import pandas as pd

print("🚀 Starting the Market Merger...")

def clean_google_trends(file_path, skill_name):
    try:
        # Google Trends adds a weird title row, so we skip the first row (skiprows=1)
        df = pd.read_csv(file_path, skiprows=1)
        
        # Prophet requires exactly two columns: 'ds' (Date) and 'y' (Value)
        # The first column is Month/Week, the second is the Interest
        df = df.iloc[:, [0, 1]] 
        df.columns = ['ds', 'y']
        
        # Add a column so the AI knows which skill this is
        df['skill'] = skill_name
        
        # Clean the data types
        df['ds'] = pd.to_datetime(df['ds'])
        df['y'] = pd.to_numeric(df['y'], errors='coerce') # Force numbers
        
        # Drop any empty rows
        df = df.dropna()
        print(f"✅ Successfully cleaned {skill_name} data! ({len(df)} rows)")
        return df
    
    except Exception as e:
        print(f"🚨 Error reading {file_path}: {e}")
        return pd.DataFrame() # Return empty if it fails

# 1. Load and clean each individual file
python_data = clean_google_trends(r"C:\Users\chara\OneDrive\ドキュメント\tyechniosis\python.csv", 'Python')
react_data = clean_google_trends(r"C:\Users\chara\OneDrive\ドキュメント\tyechniosis\React.csv", 'React')
rust_data = clean_google_trends(r"C:\Users\chara\OneDrive\ドキュメント\tyechniosis\Rust.csv", 'Rust')
javascript_data = clean_google_trends(r"C:\Users\chara\OneDrive\ドキュメント\tyechniosis\Java Script.csv", 'JavaScript')
artificial_intelligence_data = clean_google_trends(r"C:\Users\chara\OneDrive\ドキュメント\tyechniosis\Artificial Intelligence.csv", 'Artificial Intelligence')

# 2. MERGE THEM! (Vertical Stack)
print("\n🔄 Merging into the Master Archive...")
master_market_db = pd.concat([python_data, react_data, rust_data], ignore_index=True)

# 3. Save the final output
master_market_db.to_csv('master_market_data.csv', index=False)
print("🎉 Success! Saved as 'master_market_data.csv'.")
print("You can now feed this file directly into your AI Engine!")