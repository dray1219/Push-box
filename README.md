# 推箱子 Push-box

這是一款經典推箱子遊戲，用純 JavaScript、HTML 和 CSS 寫成的。  
沒有框架、沒有套件，點開就能玩。

👉 [遊戲連結](https://dray1219.github.io/Push-box/)

![image](https://github.com/user-attachments/assets/6bf040b9-fce5-4d85-ab39-8dea61bebce8)

---

##  基本介紹

玩家扮演史萊姆，把所有箱子推到指定的位置（目標點）就算過關。  
可以選擇 簡單 普通 困難 難度
每關都會隨機產生，而且一定**保證可解**！

---

##  怎麼玩

- 開啟 [遊戲連結](https://dray1219.github.io/Push-box/)
- 使用方向鍵 W S A D 來移動角色
- 支援觸控控制 **手機也能玩!!**
- 箱子只能「推」，不能拉
- 把所有箱子推到綠色目標格上，就過關！


---

##  地圖怎麼生成的？

每一關的地圖是**自動生成**的，系統會：
1. 隨機放置角色、箱子、目標點
2. 加入一些牆壁讓關卡更有挑戰
3. 用演算法檢查是不是「一定能解」  
   （不能解就重新生成，直到找到能玩的為止）

---

## 🚧 TODO / 想加的功能

- BGM
- 獎勵系統
- 商店系統
- 換皮系統
