import os
import asyncio
import pandas as pd
import numpy as np
from datetime import datetime, timedelta, date
from typing import List, Dict, Optional, Any
from motor.motor_asyncio import AsyncIOMotorClient
from emergentintegrations.llm.chat import LlmChat, UserMessage
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
import json
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AIServices:
    def __init__(self, db):
        self.db = db
        self.api_key = os.getenv('EMERGENT_LLM_KEY')
        if not self.api_key:
            raise ValueError("EMERGENT_LLM_KEY not found in environment variables")

    async def get_ai_chat(self, session_id: str, system_message: str) -> LlmChat:
        """Initialize AI chat with Emergent LLM"""
        chat = LlmChat(
            api_key=self.api_key,
            session_id=session_id,
            system_message=system_message
        ).with_model("openai", "gpt-4o-mini")
        return chat

    # =================== ASSISTANT IA INTELLIGENT ===================
    
    async def ai_assistant_chat(self, shop_id: str, user_message: str, session_id: str = "commerce-assistant") -> str:
        """Assistant IA pour aider les gérants dans leurs décisions"""
        try:
            # Récupérer les données contextuelles de la boutique
            context_data = await self._get_shop_context(shop_id)
            
            system_message = f"""Tu es un assistant IA expert en gestion commerciale pour la boutique. 
            Voici les données actuelles de la boutique :
            
            CONTEXTE BOUTIQUE:
            {json.dumps(context_data, indent=2, ensure_ascii=False)}
            
            Tu peux aider avec :
            - Analyse des ventes et tendances
            - Conseils d'optimisation des stocks
            - Stratégies de pricing
            - Recommandations produits
            - Analyse de performance
            - Conseils pour améliorer la rentabilité
            
            Réponds de manière claire, précise et actionnable. Utilise les données fournies pour donner des conseils personnalisés."""
            
            chat = await self.get_ai_chat(session_id, system_message)
            user_msg = UserMessage(text=user_message)
            response = await chat.send_message(user_msg)
            return response
            
        except Exception as e:
            logger.error(f"Error in AI assistant chat: {str(e)}")
            return f"Désolé, je rencontre une erreur temporaire. Veuillez réessayer. ({str(e)})"

    async def _get_shop_context(self, shop_id: str) -> Dict[str, Any]:
        """Récupérer le contexte complet de la boutique pour l'IA"""
        try:
            today = datetime.combine(date.today(), datetime.min.time())
            week_ago = today - timedelta(days=7)
            month_ago = today - timedelta(days=30)
            
            # Statistiques générales
            total_products = await self.db.products.count_documents({"shop_id": shop_id, "is_active": True})
            total_customers = await self.db.customers.count_documents({"shop_id": shop_id})
            
            # Ventes aujourd'hui
            today_orders = await self.db.orders.find({
                "shop_id": shop_id,
                "created_at": {"$gte": today},
                "status": {"$ne": "cancelled"}
            }).to_list(1000)
            
            today_sales = sum(order.get("total_amount", 0) for order in today_orders)
            
            # Ventes de la semaine
            week_orders = await self.db.orders.find({
                "shop_id": shop_id,
                "created_at": {"$gte": week_ago},
                "status": {"$ne": "cancelled"}
            }).to_list(1000)
            
            week_sales = sum(order.get("total_amount", 0) for order in week_orders)
            
            # Produits en stock faible
            products = await self.db.products.find({"shop_id": shop_id, "is_active": True}).to_list(1000)
            low_stock = [p for p in products if p.get("stock_quantity", 0) <= p.get("min_stock_level", 5)]
            
            # Top produits vendus
            product_sales = {}
            for order in week_orders:
                for item in order.get("items", []):
                    product_id = item.get("product_id")
                    quantity = item.get("quantity", 0)
                    product_sales[product_id] = product_sales.get(product_id, 0) + quantity
            
            top_products = sorted(product_sales.items(), key=lambda x: x[1], reverse=True)[:5]
            
            return {
                "shop_id": shop_id,
                "date_analyse": today.isoformat(),
                "statistiques_generales": {
                    "total_produits": total_products,
                    "total_clients": total_customers,
                    "produits_stock_faible": len(low_stock)
                },
                "ventes": {
                    "aujourd_hui": {
                        "montant": today_sales,
                        "nombre_commandes": len(today_orders)
                    },
                    "cette_semaine": {
                        "montant": week_sales,
                        "nombre_commandes": len(week_orders)
                    }
                },
                "alertes_stock": [
                    {
                        "nom": p.get("name"),
                        "stock_actuel": p.get("stock_quantity", 0),
                        "stock_minimum": p.get("min_stock_level", 5)
                    } for p in low_stock[:5]
                ],
                "top_produits_semaine": [
                    {
                        "product_id": pid,
                        "quantite_vendue": qty,
                        "nom_produit": next((p.get("name") for p in products if p.get("id") == pid), "Inconnu")
                    } for pid, qty in top_products
                ]
            }
            
        except Exception as e:
            logger.error(f"Error getting shop context: {str(e)}")
            return {"error": f"Erreur lors de la récupération du contexte: {str(e)}"}

    # =================== ANALYSE PRÉDICTIVE DES VENTES ===================
    
    async def predict_sales(self, shop_id: str, days_ahead: int = 7) -> Dict[str, Any]:
        """Prédiction des ventes futures basée sur l'historique"""
        try:
            # Récupérer l'historique des ventes des 90 derniers jours
            end_date = datetime.now()
            start_date = end_date - timedelta(days=90)
            
            orders = await self.db.orders.find({
                "shop_id": shop_id,
                "created_at": {"$gte": start_date, "$lte": end_date},
                "status": {"$ne": "cancelled"}
            }).to_list(10000)
            
            if len(orders) < 7:
                return {
                    "error": "Pas assez de données historiques pour faire une prédiction fiable",
                    "minimum_required": 7,
                    "current_data_points": len(orders)
                }
            
            # Préparer les données pour la prédiction
            daily_sales = {}
            for order in orders:
                order_date = order["created_at"].date()
                daily_sales[order_date] = daily_sales.get(order_date, 0) + order.get("total_amount", 0)
            
            # Convertir en DataFrame
            dates = sorted(daily_sales.keys())
            amounts = [daily_sales[date] for date in dates]
            
            # Créer des features temporelles
            X = []
            y = amounts
            
            for i, date in enumerate(dates):
                day_of_week = date.weekday()  # 0=Lundi, 6=Dimanche
                day_of_month = date.day
                is_weekend = 1 if day_of_week >= 5 else 0
                X.append([i, day_of_week, day_of_month, is_weekend])
            
            X = np.array(X)
            y = np.array(y)
            
            # Entraîner le modèle
            model = LinearRegression()
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)
            model.fit(X_scaled, y)
            
            # Faire les prédictions
            predictions = []
            last_date = dates[-1]
            
            for i in range(1, days_ahead + 1):
                future_date = last_date + timedelta(days=i)
                day_of_week = future_date.weekday()
                day_of_month = future_date.day
                is_weekend = 1 if day_of_week >= 5 else 0
                
                feature = np.array([[len(dates) + i - 1, day_of_week, day_of_month, is_weekend]])
                feature_scaled = scaler.transform(feature)
                prediction = model.predict(feature_scaled)[0]
                
                predictions.append({
                    "date": future_date.isoformat(),
                    "predicted_sales": max(0, prediction),  # Pas de ventes négatives
                    "day_name": future_date.strftime("%A"),
                    "confidence": "moyenne"  # Simplification pour cette version
                })
            
            # Calculer les métriques de performance
            recent_avg = np.mean(amounts[-7:]) if len(amounts) >= 7 else np.mean(amounts)
            predicted_total = sum(p["predicted_sales"] for p in predictions)
            trend = "hausse" if predicted_total > (recent_avg * days_ahead) else "baisse"
            
            return {
                "shop_id": shop_id,
                "prediction_period": f"{days_ahead} jours",
                "predictions": predictions,
                "total_predicted": predicted_total,
                "average_daily_predicted": predicted_total / days_ahead,
                "recent_average": recent_avg,
                "trend": trend,
                "confidence_level": "moyenne",
                "data_points_used": len(orders),
                "period_analyzed": f"{start_date.date()} à {end_date.date()}"
            }
            
        except Exception as e:
            logger.error(f"Error in sales prediction: {str(e)}")
            return {"error": f"Erreur lors de la prédiction des ventes: {str(e)}"}

    # =================== OPTIMISATION INTELLIGENTE DES STOCKS ===================
    
    async def optimize_stock_levels(self, shop_id: str) -> Dict[str, Any]:
        """Optimisation intelligente des niveaux de stock"""
        try:
            # Récupérer les produits et l'historique des ventes
            products = await self.db.products.find({"shop_id": shop_id, "is_active": True}).to_list(1000)
            
            if not products:
                return {"error": "Aucun produit actif trouvé pour cette boutique"}
            
            # Analyser chaque produit
            recommendations = []
            
            for product in products:
                product_id = product["id"]
                current_stock = product.get("stock_quantity", 0)
                min_level = product.get("min_stock_level", 5)
                
                # Calculer la demande historique (30 derniers jours)
                thirty_days_ago = datetime.now() - timedelta(days=30)
                
                orders = await self.db.orders.find({
                    "shop_id": shop_id,
                    "created_at": {"$gte": thirty_days_ago},
                    "status": {"$ne": "cancelled"}
                }).to_list(1000)
                
                total_sold = 0
                sales_days = set()
                
                for order in orders:
                    for item in order.get("items", []):
                        if item.get("product_id") == product_id:
                            total_sold += item.get("quantity", 0)
                            sales_days.add(order["created_at"].date())
                
                # Calculer les métriques
                avg_daily_demand = total_sold / 30 if total_sold > 0 else 0
                sales_frequency = len(sales_days) / 30 if sales_days else 0
                
                # Déterminer le statut et les recommandations
                days_of_stock = current_stock / avg_daily_demand if avg_daily_demand > 0 else float('inf')
                
                if current_stock <= min_level:
                    priority = "urgent"
                    status = "stock_critique"
                elif days_of_stock < 7:
                    priority = "elevee"
                    status = "stock_faible"
                elif days_of_stock > 30:
                    priority = "faible"
                    status = "surstock"
                else:
                    priority = "normale"
                    status = "stock_optimal"
                
                # Recommandation de stock optimal
                if avg_daily_demand > 0:
                    # Stock pour 14 jours + stock de sécurité
                    recommended_stock = int((avg_daily_demand * 14) + (avg_daily_demand * 3))
                    reorder_quantity = max(0, recommended_stock - current_stock)
                else:
                    recommended_stock = min_level
                    reorder_quantity = max(0, min_level - current_stock)
                
                recommendations.append({
                    "product_id": product_id,
                    "product_name": product["name"],
                    "current_stock": current_stock,
                    "min_level": min_level,
                    "total_sold_30_days": total_sold,
                    "avg_daily_demand": round(avg_daily_demand, 2),
                    "days_of_stock": round(days_of_stock, 1) if days_of_stock != float('inf') else "infini",
                    "sales_frequency": round(sales_frequency, 2),
                    "status": status,
                    "priority": priority,
                    "recommended_stock": recommended_stock,
                    "reorder_quantity": reorder_quantity,
                    "sku": product.get("sku"),
                    "price": product.get("price", 0)
                })
            
            # Trier par priorité
            priority_order = {"urgent": 1, "elevee": 2, "normale": 3, "faible": 4}
            recommendations.sort(key=lambda x: priority_order.get(x["priority"], 5))
            
            # Statistiques globales
            urgent_items = len([r for r in recommendations if r["priority"] == "urgent"])
            total_reorder_value = sum(r["reorder_quantity"] * r["price"] for r in recommendations)
            
            return {
                "shop_id": shop_id,
                "analysis_date": datetime.now().isoformat(),
                "total_products_analyzed": len(products),
                "urgent_reorders": urgent_items,
                "total_reorder_value": total_reorder_value,
                "recommendations": recommendations[:20],  # Limiter à 20 pour la performance
                "summary": {
                    "stock_critique": len([r for r in recommendations if r["status"] == "stock_critique"]),
                    "stock_faible": len([r for r in recommendations if r["status"] == "stock_faible"]),
                    "stock_optimal": len([r for r in recommendations if r["status"] == "stock_optimal"]),
                    "surstock": len([r for r in recommendations if r["status"] == "surstock"])
                }
            }
            
        except Exception as e:
            logger.error(f"Error in stock optimization: {str(e)}")
            return {"error": f"Erreur lors de l'optimisation des stocks: {str(e)}"}

    # =================== RECOMMANDATIONS PRODUITS ===================
    
    async def get_product_recommendations(self, shop_id: str, customer_id: Optional[str] = None, current_cart: Optional[List[str]] = None) -> Dict[str, Any]:
        """Recommandations de produits pour cross-selling et up-selling"""
        try:
            products = await self.db.products.find({"shop_id": shop_id, "is_active": True}).to_list(1000)
            
            if not products:
                return {"error": "Aucun produit actif trouvé"}
            
            # Analyser les habitudes d'achat
            orders = await self.db.orders.find({
                "shop_id": shop_id,
                "status": {"$ne": "cancelled"}
            }).to_list(5000)
            
            # Créer une matrice de co-occurrence des produits
            product_combinations = {}
            product_sales = {}
            
            for order in orders:
                items = order.get("items", [])
                product_ids = [item.get("product_id") for item in items]
                
                # Compter les ventes individuelles
                for product_id in product_ids:
                    product_sales[product_id] = product_sales.get(product_id, 0) + 1
                
                # Compter les combinaisons
                for i, product_a in enumerate(product_ids):
                    for j, product_b in enumerate(product_ids):
                        if i != j:
                            combo = tuple(sorted([product_a, product_b]))
                            product_combinations[combo] = product_combinations.get(combo, 0) + 1
            
            recommendations = {
                "frequently_bought_together": [],
                "trending_products": [],
                "personalized_recommendations": [],
                "upselling_opportunities": []
            }
            
            # Produits fréquemment achetés ensemble
            if current_cart:
                combo_scores = {}
                for cart_item in current_cart:
                    for combo, count in product_combinations.items():
                        if cart_item in combo:
                            other_product = combo[0] if combo[1] == cart_item else combo[1]
                            if other_product not in current_cart:
                                combo_scores[other_product] = combo_scores.get(other_product, 0) + count
                
                top_combos = sorted(combo_scores.items(), key=lambda x: x[1], reverse=True)[:5]
                
                for product_id, score in top_combos:
                    product = next((p for p in products if p["id"] == product_id), None)
                    if product:
                        recommendations["frequently_bought_together"].append({
                            "product_id": product_id,
                            "product_name": product["name"],
                            "price": product["price"],
                            "confidence_score": score,
                            "reason": "Souvent acheté avec les produits du panier"
                        })
            
            # Produits tendance (les plus vendus récemment)
            recent_orders = [o for o in orders if o["created_at"] >= datetime.now() - timedelta(days=7)]
            recent_sales = {}
            
            for order in recent_orders:
                for item in order.get("items", []):
                    product_id = item.get("product_id")
                    recent_sales[product_id] = recent_sales.get(product_id, 0) + item.get("quantity", 0)
            
            trending = sorted(recent_sales.items(), key=lambda x: x[1], reverse=True)[:5]
            
            for product_id, sales_count in trending:
                product = next((p for p in products if p["id"] == product_id), None)
                if product and product_id not in (current_cart or []):
                    recommendations["trending_products"].append({
                        "product_id": product_id,
                        "product_name": product["name"],
                        "price": product["price"],
                        "recent_sales": sales_count,
                        "reason": f"Vendu {sales_count} fois cette semaine"
                    })
            
            # Recommandations personnalisées basées sur l'historique du client
            if customer_id:
                customer_orders = [o for o in orders if o.get("customer_id") == customer_id]
                customer_products = set()
                
                for order in customer_orders:
                    for item in order.get("items", []):
                        customer_products.add(item.get("product_id"))
                
                # Trouver des produits similaires achetés par d'autres clients
                similar_scores = {}
                for order in orders:
                    if order.get("customer_id") != customer_id:
                        order_products = set(item.get("product_id") for item in order.get("items", []))
                        intersection = customer_products.intersection(order_products)
                        
                        if len(intersection) > 0:  # Client avec des goûts similaires
                            for product_id in order_products:
                                if product_id not in customer_products:
                                    similar_scores[product_id] = similar_scores.get(product_id, 0) + len(intersection)
                
                personalized = sorted(similar_scores.items(), key=lambda x: x[1], reverse=True)[:3]
                
                for product_id, score in personalized:
                    product = next((p for p in products if p["id"] == product_id), None)
                    if product:
                        recommendations["personalized_recommendations"].append({
                            "product_id": product_id,
                            "product_name": product["name"],
                            "price": product["price"],
                            "similarity_score": score,
                            "reason": "Basé sur vos achats précédents"
                        })
            
            # Opportunités d'upselling (produits plus chers dans la même catégorie)
            if current_cart:
                for cart_item_id in current_cart:
                    cart_product = next((p for p in products if p["id"] == cart_item_id), None)
                    if cart_product:
                        category_id = cart_product.get("category_id")
                        if category_id:
                            category_products = [p for p in products if p.get("category_id") == category_id and p["price"] > cart_product["price"]]
                            category_products.sort(key=lambda x: x["price"])
                            
                            for product in category_products[:2]:  # Max 2 par catégorie
                                recommendations["upselling_opportunities"].append({
                                    "product_id": product["id"],
                                    "product_name": product["name"],
                                    "price": product["price"],
                                    "current_product": cart_product["name"],
                                    "price_difference": product["price"] - cart_product["price"],
                                    "reason": f"Version premium de {cart_product['name']}"
                                })
            
            return {
                "shop_id": shop_id,
                "customer_id": customer_id,
                "analysis_date": datetime.now().isoformat(),
                "recommendations": recommendations,
                "total_orders_analyzed": len(orders),
                "total_products": len(products)
            }
            
        except Exception as e:
            logger.error(f"Error in product recommendations: {str(e)}")
            return {"error": f"Erreur lors des recommandations produits: {str(e)}"}

    # =================== ANALYSE DE PERFORMANCE ===================
    
    async def analyze_performance(self, shop_id: str, period_days: int = 30) -> Dict[str, Any]:
        """Analyse complète des performances de la boutique avec insights IA"""
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=period_days)
            
            # Récupérer les données
            orders = await self.db.orders.find({
                "shop_id": shop_id,
                "created_at": {"$gte": start_date, "$lte": end_date},
                "status": {"$ne": "cancelled"}
            }).to_list(10000)
            
            products = await self.db.products.find({"shop_id": shop_id, "is_active": True}).to_list(1000)
            customers = await self.db.customers.find({"shop_id": shop_id}).to_list(1000)
            
            # Métriques de base
            total_revenue = sum(order.get("total_amount", 0) for order in orders)
            total_orders = len(orders)
            unique_customers = len(set(order.get("customer_id") for order in orders if order.get("customer_id")))
            avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
            
            # Analyse des tendances quotidiennes
            daily_sales = {}
            for order in orders:
                day = order["created_at"].date()
                daily_sales[day] = daily_sales.get(day, 0) + order.get("total_amount", 0)
            
            # Analyse des produits
            product_performance = {}
            for order in orders:
                for item in order.get("items", []):
                    product_id = item.get("product_id")
                    quantity = item.get("quantity", 0)
                    revenue = item.get("total_price", 0)
                    
                    if product_id not in product_performance:
                        product_performance[product_id] = {"quantity": 0, "revenue": 0}
                    
                    product_performance[product_id]["quantity"] += quantity
                    product_performance[product_id]["revenue"] += revenue
            
            # Top et flop produits
            top_products = sorted(product_performance.items(), key=lambda x: x[1]["revenue"], reverse=True)[:5]
            slow_products = [p for p in products if p["id"] not in product_performance]
            
            # Générer des insights IA
            insights_prompt = f"""
            Analyse les performances de cette boutique sur {period_days} jours et génère des insights clés:
            
            DONNÉES:
            - Chiffre d'affaires: {total_revenue} GNF
            - Nombre de commandes: {total_orders}
            - Clients uniques: {unique_customers}
            - Panier moyen: {avg_order_value:.2f} GNF
            - Nombre de produits actifs: {len(products)}
            - Produits non vendus: {len(slow_products)}
            
            TOP PRODUITS (revenus):
            {json.dumps([{"nom": next((p["name"] for p in products if p["id"] == pid), "Inconnu"), "revenus": data["revenue"], "quantité": data["quantity"]} for pid, data in top_products], ensure_ascii=False)}
            
            Fournis 3-5 insights clés sur la performance et des recommandations d'amélioration concrètes.
            Réponds en français, format JSON avec structure: {{"insights": [{"titre": "...", "description": "...", "action_recommandee": "..."}], "score_performance": "score sur 10", "priorites": ["action1", "action2", "action3"]}}
            """
            
            chat = await self.get_ai_chat("performance-analysis", "Tu es un expert en analyse de performance commerciale.")
            user_msg = UserMessage(text=insights_prompt)
            ai_insights = await chat.send_message(user_msg)
            
            try:
                ai_analysis = json.loads(ai_insights)
            except:
                ai_analysis = {"insights": [{"titre": "Analyse en cours", "description": "L'analyse IA sera disponible sous peu.", "action_recommandee": "Vérifiez plus tard"}], "score_performance": "En cours", "priorites": ["Collecte de données"]}
            
            return {
                "shop_id": shop_id,
                "period": f"{period_days} jours",
                "analysis_date": end_date.isoformat(),
                "kpis": {
                    "total_revenue": total_revenue,
                    "total_orders": total_orders,
                    "unique_customers": unique_customers,
                    "average_order_value": avg_order_value,
                    "revenue_per_customer": total_revenue / unique_customers if unique_customers > 0 else 0,
                    "orders_per_day": total_orders / period_days,
                    "active_products": len(products),
                    "products_sold": len(product_performance),
                    "products_not_sold": len(slow_products)
                },
                "trends": {
                    "daily_sales": [{"date": str(date), "sales": amount} for date, amount in sorted(daily_sales.items())],
                    "best_performing_products": [
                        {
                            "product_id": pid,
                            "product_name": next((p["name"] for p in products if p["id"] == pid), "Inconnu"),
                            "revenue": data["revenue"],
                            "quantity_sold": data["quantity"]
                        } for pid, data in top_products
                    ],
                    "underperforming_products": [
                        {
                            "product_id": p["id"],
                            "product_name": p["name"],
                            "stock_quantity": p.get("stock_quantity", 0),
                            "reason": "Aucune vente sur la période"
                        } for p in slow_products[:10]
                    ]
                },
                "ai_insights": ai_analysis
            }
            
        except Exception as e:
            logger.error(f"Error in performance analysis: {str(e)}")
            return {"error": f"Erreur lors de l'analyse de performance: {str(e)}"}

    # =================== ASSISTANT DE PRICING ===================
    
    async def pricing_recommendations(self, shop_id: str, product_id: Optional[str] = None) -> Dict[str, Any]:
        """Recommandations de prix basées sur l'IA et l'analyse de la demande"""
        try:
            # Récupérer les produits
            if product_id:
                products = await self.db.products.find({"shop_id": shop_id, "id": product_id, "is_active": True}).to_list(1)
            else:
                products = await self.db.products.find({"shop_id": shop_id, "is_active": True}).to_list(100)
            
            if not products:
                return {"error": "Aucun produit trouvé"}
            
            recommendations = []
            
            for product in products:
                product_id = product["id"]
                current_price = product.get("price", 0)
                cost_price = product.get("cost_price", 0)
                current_margin = ((current_price - cost_price) / current_price * 100) if current_price > 0 else 0
                
                # Analyser les ventes à différents prix (si historique disponible)
                thirty_days_ago = datetime.now() - timedelta(days=30)
                
                orders = await self.db.orders.find({
                    "shop_id": shop_id,
                    "created_at": {"$gte": thirty_days_ago},
                    "status": {"$ne": "cancelled"}
                }).to_list(1000)
                
                # Calculer la demande actuelle
                quantity_sold = 0
                revenue = 0
                sales_count = 0
                
                for order in orders:
                    for item in order.get("items", []):
                        if item.get("product_id") == product_id:
                            quantity_sold += item.get("quantity", 0)
                            revenue += item.get("total_price", 0)
                            sales_count += 1
                
                # Calculer l'élasticité approximative de la demande
                demand_strength = "faible"
                if quantity_sold > 10:
                    demand_strength = "forte"
                elif quantity_sold > 3:
                    demand_strength = "moyenne"
                
                # Recommandations de prix basées sur la demande et la marge
                recommendations_list = []
                
                # Prix optimal basé sur la marge cible (40%)
                if cost_price > 0:
                    target_margin_price = cost_price / 0.6  # Marge de 40%
                    
                    if target_margin_price != current_price:
                        price_change = ((target_margin_price - current_price) / current_price) * 100
                        recommendations_list.append({
                            "strategy": "optimisation_marge",
                            "recommended_price": target_margin_price,
                            "current_price": current_price,
                            "price_change_percent": price_change,
                            "reason": "Prix optimal pour une marge de 40%",
                            "expected_impact": "Amélioration de la rentabilité"
                        })
                
                # Stratégie basée sur la demande
                if demand_strength == "forte" and current_margin < 50:
                    # Possibilité d'augmenter le prix
                    higher_price = current_price * 1.1  # +10%
                    recommendations_list.append({
                        "strategy": "augmentation_demande_forte",
                        "recommended_price": higher_price,
                        "current_price": current_price,
                        "price_change_percent": 10,
                        "reason": "Demande forte permet une augmentation de prix",
                        "expected_impact": "Augmentation des revenus avec risque faible"
                    })
                
                elif demand_strength == "faible":
                    # Réduction de prix pour stimuler la demande
                    lower_price = current_price * 0.9  # -10%
                    if lower_price > cost_price * 1.2:  # Garder une marge minimum
                        recommendations_list.append({
                            "strategy": "stimulation_demande",
                            "recommended_price": lower_price,
                            "current_price": current_price,
                            "price_change_percent": -10,
                            "reason": "Réduction pour stimuler la demande faible",
                            "expected_impact": "Augmentation potentielle des ventes"
                        })
                
                # Prix psychologique (prix finissant par 9)
                psychological_price = round(current_price * 0.99 // 10) * 10 + 9
                if psychological_price != current_price and psychological_price > cost_price * 1.2:
                    recommendations_list.append({
                        "strategy": "prix_psychologique",
                        "recommended_price": psychological_price,
                        "current_price": current_price,
                        "price_change_percent": ((psychological_price - current_price) / current_price) * 100,
                        "reason": "Prix psychologique finissant par 9",
                        "expected_impact": "Amélioration de la perception client"
                    })
                
                recommendations.append({
                    "product_id": product_id,
                    "product_name": product["name"],
                    "current_price": current_price,
                    "cost_price": cost_price,
                    "current_margin_percent": current_margin,
                    "demand_analysis": {
                        "quantity_sold_30_days": quantity_sold,
                        "revenue_30_days": revenue,
                        "demand_strength": demand_strength,
                        "sales_frequency": sales_count
                    },
                    "pricing_recommendations": recommendations_list[:3]  # Limiter à 3 recommandations
                })
            
            # Générer des insights IA généraux sur la stratégie pricing
            if len(recommendations) > 0:
                pricing_prompt = f"""
                Analyse cette stratégie de pricing pour {len(recommendations)} produits et donne des conseils:
                
                DONNÉES PRODUITS:
                {json.dumps([{"nom": r["product_name"], "prix_actuel": r["current_price"], "marge": r["current_margin_percent"], "demande": r["demand_analysis"]["demand_strength"]} for r in recommendations[:5]], ensure_ascii=False)}
                
                Fournis 3 conseils stratégiques de pricing pour optimiser la rentabilité globale.
                Format: liste de conseils concrets et actionnables.
                """
                
                chat = await self.get_ai_chat("pricing-strategy", "Tu es un expert en stratégie de prix et pricing.")
                user_msg = UserMessage(text=pricing_prompt)
                ai_pricing_advice = await chat.send_message(user_msg)
            else:
                ai_pricing_advice = "Conseils disponibles après analyse des données de vente."
            
            return {
                "shop_id": shop_id,
                "analysis_date": datetime.now().isoformat(),
                "total_products_analyzed": len(recommendations),
                "recommendations": recommendations,
                "global_pricing_insights": ai_pricing_advice,
                "methodology": "Analyse basée sur la demande, les marges et les stratégies psychologiques"
            }
            
        except Exception as e:
            logger.error(f"Error in pricing recommendations: {str(e)}")
            return {"error": f"Erreur lors des recommandations de prix: {str(e)}"}