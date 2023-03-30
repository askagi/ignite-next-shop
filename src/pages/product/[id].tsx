import { ImageContainer, ProductContainer, ProductDetails } from "@/src/styles/pages/products"
import axios from "axios";
import { GetStaticPaths, GetStaticProps } from "next"
import Head from "next/head";
import { useRouter } from "next/router"
import { useState } from "react";
import Stripe from "stripe";
import { stripe } from "../../lib/stripe";

interface ProductProps {
    product: {
        id: string;
        name: string;
        imageUrl: string;
        price: string;
        description: string;
        defaultPriceId: string;
    }
}

export default function Product({ product }: ProductProps) {

    const [isCreatingCheckoutSession, setIsCreatingCheckoutSession] = useState(false)

    const { isFallback } = useRouter()
    if (isFallback) {
        return <p>...Loading</p>
    }

    async function handleBuyProduct() {
        try {
            setIsCreatingCheckoutSession(true)
            const response = await axios.post("/api/checkout", {
                priceId: product.defaultPriceId
            })

            const { checkoutUrl } = response.data;

            window.location.href = checkoutUrl;
        } catch (error) {
            setIsCreatingCheckoutSession(false)
            // Conectar com  uma ferramenta de observabilidade (Datadog / Sentry)
            alert("Falha ao redirecionar ao checkout!")
        }
    }

    return (
        <>
            <Head>
                <title>{product.name} | Ignite next Shop</title>
            </Head>

            <ProductContainer>
                <ImageContainer>
                    <img src={product.imageUrl} alt={product.name} />
                </ImageContainer>
                <ProductDetails>
                    <h1>{product.name}</h1>
                    <span>{product.price}</span>

                    <p>{product.description}</p>

                    <button
                        disabled={isCreatingCheckoutSession}
                        onClick={handleBuyProduct}
                    >
                        Comprar agora
                    </button>
                </ProductDetails>
            </ProductContainer>
        </>
    )
}

export const getStaticPaths: GetStaticPaths = async () => {
    return {
        // paths - cria uma copia da pagina no formato estatico em cache 
        paths: [
            { params: { id: "prod_NYxIK1Z2y9QZ8H" } } // Aconselhavel deixar apenas o essencial 
        ],
        fallback: true
    }
}

export const getStaticProps: GetStaticProps<any, { id: string }> = async ({ params }) => {

    const productId = params.id;

    const product = await stripe.products.retrieve(productId, {
        expand: ["default_price"]
    });

    const price = product.default_price as Stripe.Price
    return {
        props: {
            product: {
                id: product.id,
                name: product.name,
                imageUrl: product.images[0],
                price: new Intl.NumberFormat('pt-BR', {
                    currency: "BRL",
                    style: "currency"
                }).format(Number(price.unit_amount) / 100),
                description: product.description,
                defaultPriceId: price.id
            }
        },
        revalidate: 60 * 60 * 1, // 1 hora
    }
}